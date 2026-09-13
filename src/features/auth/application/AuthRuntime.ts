import type {ISigner} from '../application/ports/ISigner';
import type {NostrIdentity} from '../domain/NostrIdentity';

export type ActiveAuthSession = {
  readonly identity: NostrIdentity;
  readonly signer: ISigner;
  readonly closeRemote?: () => Promise<void>;
};

/**
 * In-memory holder for the active identity and signer.
 * Persistence is handled by IIdentitySessionStore.
 */
export class AuthRuntime {
  private session: ActiveAuthSession | null = null;

  getIdentity(): NostrIdentity | null {
    return this.session?.identity ?? null;
  }

  getSigner(): ISigner | null {
    return this.session?.signer ?? null;
  }

  setSession(session: ActiveAuthSession): void {
    const previousClose = this.session?.closeRemote;
    this.session = session;
    if (previousClose && previousClose !== session.closeRemote) {
      void previousClose().catch(() => {
        // Best-effort close of the replaced remote session.
      });
    }
  }

  async clear(): Promise<void> {
    const closeRemote = this.session?.closeRemote;
    this.session = null;
    if (closeRemote) {
      try {
        await closeRemote();
      } catch {
        // Best-effort remote logout; local clear already happened.
      }
    }
  }
}
