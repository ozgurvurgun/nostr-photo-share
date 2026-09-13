import {ok, type Result} from '../../../core/result/Result';
import type {ISigner} from './ports/ISigner';
import {createNostrIdentity, type NostrIdentity} from '../domain/NostrIdentity';
import {PublicKey} from '../domain/PublicKey';
import {
  SessionRestoreError,
  type IdentityStorageError,
  type InvalidPublicKeyError,
} from '../domain/errors';
import type {AuthRuntime} from './AuthRuntime';
import type {
  IIdentitySessionStore,
  StoredBunkerPointer,
  StoredSession,
} from './ports/IIdentitySessionStore';

export type RestoreSessionError =
  | IdentityStorageError
  | InvalidPublicKeyError
  | SessionRestoreError;

export type RestoreSessionDeps = {
  readonly store: IIdentitySessionStore;
  readonly authRuntime: AuthRuntime;
  readonly createLocalSigner: () => ISigner;
  readonly restoreBunkerSigner: (input: {
    readonly clientSecretKeyHex: string;
    readonly bunkerPointer: StoredBunkerPointer;
  }) => Promise<
    Result<{readonly signer: ISigner; readonly close: () => Promise<void>}, SessionRestoreError>
  >;
};

export class RestoreSessionUseCase {
  constructor(private readonly deps: RestoreSessionDeps) {}

  async execute(): Promise<Result<NostrIdentity | null, RestoreSessionError>> {
    const sessionResult = await this.deps.store.loadSession();
    if (!sessionResult.ok) {
      return sessionResult;
    }
    const session = sessionResult.value;
    if (session === null) {
      return ok(null);
    }

    const publicKeyResult = PublicKey.fromHex(session.pubkeyHex);
    if (!publicKeyResult.ok) {
      await this.deps.store.clear();
      return publicKeyResult;
    }

    const identity = createNostrIdentity(publicKeyResult.value, session.authMethod);

    if (session.authMethod === 'bunker') {
      return this.restoreBunker(identity, session);
    }

    const secretResult = await this.deps.store.loadSecretKeyHex();
    if (!secretResult.ok) {
      return secretResult;
    }
    if (secretResult.value === null) {
      await this.deps.store.clear();
      return errMissing('Local secret key missing from secure storage');
    }

    this.deps.authRuntime.setSession({
      identity,
      signer: this.deps.createLocalSigner(),
    });
    return ok(identity);
  }

  private async restoreBunker(
    identity: NostrIdentity,
    session: StoredSession,
  ): Promise<Result<NostrIdentity, RestoreSessionError>> {
    if (session.bunkerPointer === null) {
      await this.deps.store.clear();
      return errMissing('Bunker pointer missing from secure storage');
    }

    const secretResult = await this.deps.store.loadSecretKeyHex();
    if (!secretResult.ok) {
      return secretResult;
    }
    if (secretResult.value === null) {
      await this.deps.store.clear();
      return errMissing('Bunker client secret missing from secure storage');
    }

    const restored = await this.deps.restoreBunkerSigner({
      clientSecretKeyHex: secretResult.value,
      bunkerPointer: session.bunkerPointer,
    });
    if (!restored.ok) {
      return restored;
    }

    this.deps.authRuntime.setSession({
      identity,
      signer: restored.value.signer,
      closeRemote: restored.value.close,
    });
    return ok(identity);
  }
}

function errMissing(message: string): Result<never, SessionRestoreError> {
  return {ok: false, error: new SessionRestoreError(message)};
}
