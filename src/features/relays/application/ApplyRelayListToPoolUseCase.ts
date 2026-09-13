import {ok, err, type Result} from '../../../core/result/Result';
import type {AppError} from '../../../core/errors/errors';
import {AppError as AppErrorClass} from '../../../core/errors/errors';
import type {RelayList} from '../domain/RelayList';
import {preferenceUrls} from '../domain/RelayPreference';
import type {IRelayListCache} from './ports/IRelayListCache';

export type RelayPoolSync = {
  syncRelays(urls: readonly string[]): Promise<void>;
};

class EmptyRelayPoolError extends AppErrorClass {
  constructor(message = 'Cannot sync an empty relay set') {
    super('EMPTY_RELAY_POOL', message);
  }
}

/**
 * Syncs the relay pool to preference URLs (read and/or write).
 * Never syncs to an empty set — falls back to configured defaults when provided.
 */
export class ApplyRelayListToPoolUseCase {
  constructor(
    private readonly pool: RelayPoolSync,
    private readonly cache: IRelayListCache,
    private readonly fallbackUrls: readonly string[] = [],
  ) {}

  async execute(list: RelayList): Promise<Result<void, AppError>> {
    let urls = preferenceUrls(list.preferences, 'all');
    if (urls.length === 0) {
      urls = [...this.fallbackUrls];
    }
    if (urls.length === 0) {
      return err(new EmptyRelayPoolError());
    }
    await this.pool.syncRelays(urls);
    this.cache.set(list.ownerPubkeyHex, list);
    return ok(undefined);
  }
}
