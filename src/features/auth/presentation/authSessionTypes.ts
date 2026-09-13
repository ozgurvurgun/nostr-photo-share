import type {NostrIdentity} from '../domain/NostrIdentity';

export type AuthSessionSnapshot = {
  readonly identity: NostrIdentity | null;
  readonly isRestoring: boolean;
  readonly restoreError: string | null;
};
