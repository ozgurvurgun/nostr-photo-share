import {ok, type Result} from '../../../core/result/Result';
import type {IdentityStorageError} from '../domain/errors';
import type {AuthRuntime} from './AuthRuntime';
import type {IIdentitySessionStore} from './ports/IIdentitySessionStore';

/**
 * Clears signer session + keychain. Optional `onSessionCleared` wipes feature caches.
 * Cache wipe always runs (even if Keychain clear fails) so prior-user memory is not retained.
 */
export class LogoutUseCase {
  constructor(
    private readonly store: IIdentitySessionStore,
    private readonly authRuntime: AuthRuntime,
    private readonly onSessionCleared?: () => void | Promise<void>,
  ) {}

  async execute(): Promise<Result<void, IdentityStorageError>> {
    await this.authRuntime.clear();
    const cleared = await this.store.clear();
    try {
      await this.onSessionCleared?.();
    } catch {
      // Best-effort cache/pool reset; storage result still returned below.
    }
    if (!cleared.ok) {
      return cleared;
    }
    return ok(undefined);
  }
}
