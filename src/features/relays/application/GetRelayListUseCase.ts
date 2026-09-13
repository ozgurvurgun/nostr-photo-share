import {ok, type Result} from '../../../core/result/Result';
import {RelayList} from '../domain/RelayList';
import type {RelayListFetchError} from '../domain/errors';
import type {IRelayListCache} from './ports/IRelayListCache';
import type {IRelayListRepository} from './ports/IRelayListRepository';

/**
 * Loads the viewer's kind:10002 list.
 * Empty fetch does not wipe a richer cached (published) list - timeouts must not reset to defaults.
 * Defaults are only seeded when there is no published/cached preference set.
 */
export class GetRelayListUseCase {
  constructor(
    private readonly repository: IRelayListRepository,
    private readonly cache: IRelayListCache,
    private readonly defaultRelayUrls: readonly string[],
  ) {}

  async execute(ownerPubkeyHex: string): Promise<Result<RelayList, RelayListFetchError>> {
    const normalized = ownerPubkeyHex.trim().toLowerCase();
    const cached = this.cache.get(normalized);

    const fetchResult = await this.repository.fetchRelayList(normalized);
    if (!fetchResult.ok) {
      if (cached !== null) {
        return ok(cached.list);
      }
      return fetchResult;
    }

    let list = fetchResult.value;
    if (list.preferences.length === 0) {
      if (
        cached !== null &&
        (cached.list.eventId !== null || cached.list.preferences.length > 0)
      ) {
        return ok(cached.list);
      }
      const defaults = RelayList.fromDefaultUrls(normalized, this.defaultRelayUrls);
      if (!defaults.ok) {
        return fetchResult;
      }
      list = defaults.value;
    }

    this.cache.set(normalized, list);
    return ok(list);
  }

  getCached(ownerPubkeyHex: string): RelayList | null {
    return this.cache.get(ownerPubkeyHex.trim().toLowerCase())?.list ?? null;
  }
}
