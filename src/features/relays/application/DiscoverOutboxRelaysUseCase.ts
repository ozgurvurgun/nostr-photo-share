import {ok, type Result} from '../../../core/result/Result';
import {RECOMMENDED_RELAYS_MAX} from '../domain/constants';
import type {RelayListFetchError} from '../domain/errors';
import type {IRelayListCache} from './ports/IRelayListCache';
import type {IRelayListRepository} from './ports/IRelayListRepository';

/** Cap total unique outbox write relays to bound socket growth. */
export const MAX_OUTBOX_RELAYS_TOTAL = 24 as const;

export type OutboxPool = {
  replaceOutboxRelays(urls: readonly string[]): Promise<void>;
};

export type DiscoverOutboxResult = {
  readonly relayUrls: readonly string[];
  readonly fromCache: boolean;
};

/**
 * Fetches followed authors' NIP-65 write relays and merges them into the pool as outbox.
 * Does not replace the viewer's own relay set (see RelayPool.replaceOutboxRelays).
 */
export class DiscoverOutboxRelaysUseCase {
  constructor(
    private readonly repository: IRelayListRepository,
    private readonly cache: IRelayListCache,
    private readonly pool: OutboxPool,
    private readonly maxWritePerAuthor: number = RECOMMENDED_RELAYS_MAX,
    private readonly maxTotal: number = MAX_OUTBOX_RELAYS_TOTAL,
  ) {}

  async execute(
    authorPubkeyHexes: readonly string[],
  ): Promise<Result<DiscoverOutboxResult, RelayListFetchError>> {
    const authors = [
      ...new Set(
        authorPubkeyHexes
          .map(pubkey => pubkey.trim().toLowerCase())
          .filter(pubkey => /^[0-9a-f]{64}$/.test(pubkey)),
      ),
    ];

    if (authors.length === 0) {
      await this.pool.replaceOutboxRelays([]);
      return ok({relayUrls: [], fromCache: false});
    }

    const fetchResult = await this.repository.fetchRelayLists(authors);
    if (!fetchResult.ok) {
      const cachedUrls = this.collectWriteUrls(
        authors
          .map(author => this.cache.get(author)?.list)
          .filter((list): list is NonNullable<typeof list> => list !== undefined),
      );
      await this.pool.replaceOutboxRelays(cachedUrls);
      if (cachedUrls.length > 0) {
        return ok({relayUrls: cachedUrls, fromCache: true});
      }
      return fetchResult;
    }

    for (const list of fetchResult.value) {
      this.cache.set(list.ownerPubkeyHex, list);
    }

    const relayUrls = this.collectWriteUrls(fetchResult.value);
    await this.pool.replaceOutboxRelays(relayUrls);
    return ok({relayUrls, fromCache: false});
  }

  private collectWriteUrls(
    lists: readonly {writeUrls(): readonly string[]}[],
  ): readonly string[] {
    const urls: string[] = [];
    const seen = new Set<string>();
    for (const list of lists) {
      let taken = 0;
      for (const url of list.writeUrls()) {
        if (taken >= this.maxWritePerAuthor) {
          break;
        }
        if (seen.has(url)) {
          continue;
        }
        seen.add(url);
        urls.push(url);
        taken += 1;
        if (urls.length >= this.maxTotal) {
          return urls;
        }
      }
    }
    return urls;
  }
}
