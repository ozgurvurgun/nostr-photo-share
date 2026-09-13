import {err, ok, type Result} from '../../../core/result/Result';
import type {NostrGateway} from '../../../infrastructure/nostr/gateway/NostrGateway';
import type {SignedNostrEvent} from '../../../infrastructure/nostr/protocol/event';
import type {RelayPool} from '../../../infrastructure/nostr/relay/RelayPool';
import {FeedFetchError, FeedPublishError} from '../domain/errors';
import {PICTURE_EVENT_KIND} from '../domain/PictureKind';
import type {ImagePost} from '../domain/ImagePost';
import type {
  FeedPage,
  FeedPageQuery,
  IFeedRepository,
} from '../application/ports/IFeedRepository';
import {Kind20Mapper} from './Kind20Mapper';

function comparePostsNewestFirst(a: ImagePost, b: ImagePost): number {
  if (a.createdAt !== b.createdAt) {
    return b.createdAt - a.createdAt;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

const MAX_FETCH_ROUNDS = 3;
const OVERFETCH_FACTOR = 3;

/**
 * Multi-relay feed aggregation via NostrGateway.query (EOSE/timeout + dedupe).
 * Optional `authors` filter used when a follow list is available (Phase 5).
 */
export class NostrFeedRepository implements IFeedRepository {
  constructor(
    private readonly gateway: NostrGateway,
    private readonly queryTimeoutMs: number,
    private readonly relayPool: RelayPool,
  ) {}

  async fetchPage(query: FeedPageQuery): Promise<Result<FeedPage, FeedFetchError>> {
    const limit = Math.max(1, Math.min(query.limit, 100));

    if (this.relayPool.getConnectedRelayCount() === 0) {
      return err(new FeedFetchError('No relays connected'));
    }

    try {
      const collected: ImagePost[] = [];
      const seen = new Set<string>();
      let cursor = query.until;
      let exhausted = false;

      for (let round = 0; round < MAX_FETCH_ROUNDS && collected.length < limit; round += 1) {
        const requestLimit = Math.min(100, Math.max(limit, limit * OVERFETCH_FACTOR));
        const filter = {
          kinds: [PICTURE_EVENT_KIND],
          limit: requestLimit,
          ...(cursor !== undefined ? {until: cursor} : {}),
          ...(query.authors !== undefined && query.authors.length > 0
            ? {authors: query.authors}
            : {}),
        };

        const events = await this.gateway.query([filter], {
          timeoutMs: this.queryTimeoutMs,
        });

        if (events.length === 0) {
          exhausted = true;
          break;
        }

        let oldestRawCreatedAt: number | null = null;
        for (const event of events) {
          if (oldestRawCreatedAt === null || event.created_at < oldestRawCreatedAt) {
            oldestRawCreatedAt = event.created_at;
          }
          if (seen.has(event.id)) {
            continue;
          }
          seen.add(event.id);
          const mapped = Kind20Mapper.fromEvent(event);
          if (!mapped.ok) {
            continue;
          }
          collected.push(mapped.value);
        }

        collected.sort(comparePostsNewestFirst);

        if (events.length < requestLimit) {
          exhausted = true;
          break;
        }

        if (oldestRawCreatedAt === null) {
          exhausted = true;
          break;
        }
        // NIP-01 `until` is inclusive; keep same timestamp and rely on id dedupe.
        cursor = oldestRawCreatedAt;
        if (collected.length >= limit) {
          break;
        }
      }

      const page = collected.slice(0, limit);
      const nextUntil =
        exhausted || page.length < limit || page.length === 0
          ? null
          : page[page.length - 1]!.createdAt;

      return ok({posts: page, nextUntil});
    } catch (cause) {
      return err(new FeedFetchError('Failed to fetch picture feed from relays', {cause}));
    }
  }

  async publish(event: SignedNostrEvent): Promise<Result<void, FeedPublishError>> {
    try {
      const results = await this.gateway.publish(event);
      if (results.some(result => result.accepted)) {
        return ok(undefined);
      }
      const message =
        results.find(result => result.message)?.message ?? 'No relay accepted the picture event';
      return err(new FeedPublishError(message));
    } catch (cause) {
      return err(new FeedPublishError('Failed to publish picture event', {cause}));
    }
  }
}
