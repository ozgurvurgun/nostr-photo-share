import {ok, type Result} from '../../../core/result/Result';
import {createNostrIdentity, type NostrIdentity} from '../domain/NostrIdentity';
import {PublicKey} from '../domain/PublicKey';
import type {
  BunkerConnectionError,
  IdentityStorageError,
  InvalidPublicKeyError,
} from '../domain/errors';
import type {AuthRuntime} from './AuthRuntime';
import type {BunkerConnectOptions, IBunkerConnector} from './ports/IBunkerConnector';
import type {IIdentitySessionStore} from './ports/IIdentitySessionStore';

export type ConnectBunkerError =
  | BunkerConnectionError
  | IdentityStorageError
  | InvalidPublicKeyError;

export class ConnectBunkerUseCase {
  constructor(
    private readonly store: IIdentitySessionStore,
    private readonly bunkerConnector: IBunkerConnector,
    private readonly authRuntime: AuthRuntime,
  ) {}

  async execute(
    uri: string,
    options?: BunkerConnectOptions,
  ): Promise<Result<NostrIdentity, ConnectBunkerError>> {
    const connected = await this.bunkerConnector.connect(uri.trim(), options);
    if (!connected.ok) {
      return connected;
    }

    const publicKeyResult = PublicKey.fromHex(connected.value.remotePubkeyHex);
    if (!publicKeyResult.ok) {
      await connected.value.close();
      return publicKeyResult;
    }

    const saveSecret = await this.store.saveSecretKeyHex(connected.value.clientSecretKeyHex);
    if (!saveSecret.ok) {
      await connected.value.close();
      return saveSecret;
    }

    const identity = createNostrIdentity(publicKeyResult.value, 'bunker');
    const saveSession = await this.store.saveSession({
      authMethod: identity.authMethod,
      pubkeyHex: identity.publicKey.toHex(),
      bunkerPointer: connected.value.bunkerPointer,
    });
    if (!saveSession.ok) {
      await this.store.clear();
      await connected.value.close();
      return saveSession;
    }

    this.authRuntime.setSession({
      identity,
      signer: connected.value.signer,
      closeRemote: connected.value.close,
    });

    return ok(identity);
  }
}
