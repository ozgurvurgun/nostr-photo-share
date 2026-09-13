import {bytesToHex, wipeBytes} from '../../../core/utilities/hex';
import {ok, type Result} from '../../../core/result/Result';
import type {ISigner} from './ports/ISigner';
import {createNostrIdentity, type NostrIdentity} from '../domain/NostrIdentity';
import {PublicKey} from '../domain/PublicKey';
import type {IdentityStorageError, InvalidPublicKeyError} from '../domain/errors';
import type {AuthRuntime} from './AuthRuntime';
import type {IIdentitySessionStore} from './ports/IIdentitySessionStore';
import type {IKeyGenerator} from './ports/IKeyGenerator';

export type CreateIdentityError = IdentityStorageError | InvalidPublicKeyError;

export class CreateIdentityUseCase {
  constructor(
    private readonly store: IIdentitySessionStore,
    private readonly keyGenerator: IKeyGenerator,
    private readonly authRuntime: AuthRuntime,
    private readonly createLocalSigner: () => ISigner,
  ) {}

  async execute(): Promise<Result<NostrIdentity, CreateIdentityError>> {
    const secretKey = this.keyGenerator.generateSecretKey();
    try {
      const pubkeyHex = this.keyGenerator.getPublicKeyHex(secretKey);
      const publicKeyResult = PublicKey.fromHex(pubkeyHex);
      if (!publicKeyResult.ok) {
        return publicKeyResult;
      }

      const saveSecret = await this.store.saveSecretKeyHex(bytesToHex(secretKey));
      if (!saveSecret.ok) {
        return saveSecret;
      }

      const identity = createNostrIdentity(publicKeyResult.value, 'generated');
      const saveSession = await this.store.saveSession({
        authMethod: identity.authMethod,
        pubkeyHex: identity.publicKey.toHex(),
        bunkerPointer: null,
      });
      if (!saveSession.ok) {
        await this.store.clear();
        return saveSession;
      }

      this.authRuntime.setSession({
        identity,
        signer: this.createLocalSigner(),
      });

      return ok(identity);
    } finally {
      wipeBytes(secretKey);
    }
  }
}
