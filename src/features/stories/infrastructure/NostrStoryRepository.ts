import {err, ok, type Result} from '../../../core/result/Result';
import type {NostrGateway} from '../../../infrastructure/nostr/gateway/NostrGateway';
import type {SignedNostrEvent} from '../../../infrastructure/nostr/protocol/event';
import type {RelayPool} from '../../../infrastructure/nostr/relay/RelayPool';
import type {
  ActiveStoriesQuery,
  IStoryRepository,
} from '../application/ports/IStoryRepository';
import {StoryFetchError, StoryPublishError} from '../domain/errors';
import {isStoryExpired, type Story} from '../domain/Story';
import {STORY_KIND} from '../domain/StoryKind';
import {Kind20StoryMapper} from './Kind20StoryMapper';

function compareStoriesNewestFirst(a: Story, b: Story): number {
  if (a.createdAt !== b.createdAt) {
    return b.createdAt - a.createdAt;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Multi-relay story aggregation: kind:20 pictures that carry NIP-40 expiration.
 * Always filters expired stories client-side after mapping.
 */
export class NostrStoryRepository implements IStoryRepository {
  constructor(
    private readonly gateway: NostrGateway,
    private readonly queryTimeoutMs: number,
    private readonly relayPool: RelayPool,
  ) {}

  async fetchActive(query: ActiveStoriesQuery): Promise<Result<readonly Story[], StoryFetchError>> {
    const limit = Math.max(1, Math.min(query.limit, 100));
    const nowSec = Math.floor(Date.now() / 1000);

    if (this.relayPool.getConnectedRelayCount() === 0) {
      return err(new StoryFetchError('No relays connected'));
    }

    try {
      // Over-fetch: many kind:20 events are durable posts without expiration.
      const filter = {
        kinds: [STORY_KIND],
        limit: Math.min(100, Math.max(limit * 4, 40)),
        ...(query.authors !== undefined && query.authors.length > 0
          ? {authors: query.authors}
          : {}),
      };

      const events = await this.gateway.query([filter], {
        timeoutMs: this.queryTimeoutMs,
      });

      const collected: Story[] = [];
      const seen = new Set<string>();
      for (const event of events) {
        if (seen.has(event.id)) {
          continue;
        }
        seen.add(event.id);
        const mapped = Kind20StoryMapper.fromEvent(event);
        if (!mapped.ok) {
          continue;
        }
        if (isStoryExpired(mapped.value, nowSec)) {
          continue;
        }
        collected.push(mapped.value);
      }

      collected.sort(compareStoriesNewestFirst);
      return ok(collected.slice(0, limit));
    } catch (cause) {
      return err(new StoryFetchError('Failed to fetch stories from relays', {cause}));
    }
  }

  async publish(event: SignedNostrEvent): Promise<Result<void, StoryPublishError>> {
    try {
      const results = await this.gateway.publish(event);
      if (results.some(result => result.accepted)) {
        return ok(undefined);
      }
      const message =
        results.find(result => result.message)?.message ?? 'No relay accepted the story event';
      return err(new StoryPublishError(message));
    } catch (cause) {
      return err(new StoryPublishError('Failed to publish story event', {cause}));
    }
  }
}
