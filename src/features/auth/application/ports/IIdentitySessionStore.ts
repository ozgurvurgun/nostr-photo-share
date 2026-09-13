import type {Result} from '../../../../core/result/Result';
import type {AuthMethod} from '../../domain/AuthMethod';
import type {IdentityStorageError} from '../../domain/errors';

export type StoredBunkerPointer = {
  readonly relays: readonly string[];
  readonly pubkey: string;
  readonly secret: string | null;
};

export type StoredSession = {
  readonly authMethod: AuthMethod;
  readonly pubkeyHex: string;
  readonly bunkerPointer: StoredBunkerPointer | null;
};

export interface IIdentitySessionStore {
  saveSecretKeyHex(hex: string): Promise<Result<void, IdentityStorageError>>;
  loadSecretKeyHex(): Promise<Result<string | null, IdentityStorageError>>;
  saveSession(session: StoredSession): Promise<Result<void, IdentityStorageError>>;
  loadSession(): Promise<Result<StoredSession | null, IdentityStorageError>>;
  clear(): Promise<Result<void, IdentityStorageError>>;
}
