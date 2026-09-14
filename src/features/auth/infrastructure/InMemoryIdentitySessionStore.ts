import {err, ok, type Result} from '../../../core/result/Result';
import {IdentityStorageError} from '../domain/errors';
import type {
  IIdentitySessionStore,
  StoredSession,
} from '../application/ports/IIdentitySessionStore';

export class InMemoryIdentitySessionStore implements IIdentitySessionStore {
  private secretKeyHex: string | null = null;
  private session: StoredSession | null = null;

  async saveSecretKeyHex(hex: string): Promise<Result<void, IdentityStorageError>> {
    this.secretKeyHex = hex;
    return ok(undefined);
  }

  async loadSecretKeyHex(): Promise<Result<string | null, IdentityStorageError>> {
    return ok(this.secretKeyHex);
  }

  async unlockSecretKeyHex(): Promise<Result<string | null, IdentityStorageError>> {
    return ok(this.secretKeyHex);
  }

  async saveSession(session: StoredSession): Promise<Result<void, IdentityStorageError>> {
    this.session = session;
    return ok(undefined);
  }

  async loadSession(): Promise<Result<StoredSession | null, IdentityStorageError>> {
    return ok(this.session);
  }

  async clear(): Promise<Result<void, IdentityStorageError>> {
    this.secretKeyHex = null;
    this.session = null;
    return ok(undefined);
  }
}

/** Test helper that can force storage failures. */
export class FailingIdentitySessionStore implements IIdentitySessionStore {
  constructor(private readonly message = 'forced storage failure') {}

  async saveSecretKeyHex(): Promise<Result<void, IdentityStorageError>> {
    return err(new IdentityStorageError(this.message));
  }

  async loadSecretKeyHex(): Promise<Result<string | null, IdentityStorageError>> {
    return err(new IdentityStorageError(this.message));
  }

  async unlockSecretKeyHex(): Promise<Result<string | null, IdentityStorageError>> {
    return err(new IdentityStorageError(this.message));
  }

  async saveSession(): Promise<Result<void, IdentityStorageError>> {
    return err(new IdentityStorageError(this.message));
  }

  async loadSession(): Promise<Result<StoredSession | null, IdentityStorageError>> {
    return err(new IdentityStorageError(this.message));
  }

  async clear(): Promise<Result<void, IdentityStorageError>> {
    return err(new IdentityStorageError(this.message));
  }
}
