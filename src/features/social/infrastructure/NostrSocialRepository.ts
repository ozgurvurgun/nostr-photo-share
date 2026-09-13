import {err, ok, type Result} from '../../../core/result/Result';
import type {NostrGateway} from '../../../infrastructure/nostr/gateway/NostrGateway';
import type {SignedNostrEvent} from '../../../infrastructure/nostr/protocol/event';
import type {RelayPool} from '../../../infrastructure/nostr/relay/RelayPool';
import type {ISocialRepository} from '../application/ports/ISocialRepository';
import type {Comment} from '../domain/Comment';
import {FollowList} from '../domain/FollowList';
import type {Reaction} from '../domain/Reaction';
import {SocialFetchError, SocialPublishError} from '../domain/errors';
import {COMMENT_KIND, FOLLOW_LIST_KIND, REACTION_KIND} from '../domain/kinds';
import {Kind1111Mapper} from './Kind1111Mapper';
import {Kind3Mapper} from './Kind3Mapper';
import {Kind7Mapper} from './Kind7Mapper';

/**
 * Social graph + reactions + comments via NostrGateway.
 * Fails fetch when zero relays are connected (same pattern as NostrFeedRepository).
 */
export class NostrSocialRepository implements ISocialRepository {
  constructor(
    private readonly gateway: NostrGateway,
    private readonly queryTimeoutMs: number,
    private readonly relayPool: RelayPool,
  ) {}

  async fetchFollowList(
    ownerPubkeyHex: string,
  ): Promise<Result<FollowList, SocialFetchError>> {
    if (this.relayPool.getConnectedRelayCount() === 0) {
      return err(new SocialFetchError('No relays connected'));
    }

    const normalized = ownerPubkeyHex.trim().toLowerCase();
    try {
      const events = await this.gateway.query(
        [{kinds: [FOLLOW_LIST_KIND], authors: [normalized], limit: 50}],
        {timeoutMs: this.queryTimeoutMs},
      );

      const kind3 = events.filter(
        event =>
          event.kind === FOLLOW_LIST_KIND &&
          event.pubkey.trim().toLowerCase() === normalized,
      );
      const latest = Kind3Mapper.pickLatestReplaceable(kind3);
      if (latest === null) {
        const empty = FollowList.empty(normalized);
        if (!empty.ok) {
          return err(new SocialFetchError(empty.error.message));
        }
        return ok(empty.value);
      }
      const mapped = Kind3Mapper.fromEvent(latest);
      if (!mapped.ok) {
        return err(new SocialFetchError(mapped.error.message));
      }
      return ok(mapped.value);
    } catch (cause) {
      return err(new SocialFetchError('Failed to fetch follow list from relays', {cause}));
    }
  }

  async fetchReactionsForEvents(
    eventIds: readonly string[],
  ): Promise<Result<readonly Reaction[], SocialFetchError>> {
    if (this.relayPool.getConnectedRelayCount() === 0) {
      return err(new SocialFetchError('No relays connected'));
    }

    const ids = [
      ...new Set(eventIds.map(id => id.trim().toLowerCase()).filter(id => id.length > 0)),
    ];
    if (ids.length === 0) {
      return ok([]);
    }

    try {
      const events = await this.gateway.query(
        [{kinds: [REACTION_KIND], '#e': ids, limit: Math.min(500, ids.length * 50)}],
        {timeoutMs: this.queryTimeoutMs},
      );

      const reactions: Reaction[] = [];
      for (const event of events) {
        const mapped = Kind7Mapper.fromEvent(event);
        if (mapped.ok && mapped.value.isLike) {
          reactions.push(mapped.value);
        }
      }
      return ok(reactions);
    } catch (cause) {
      return err(new SocialFetchError('Failed to fetch reactions from relays', {cause}));
    }
  }

  async fetchCommentsForRoot(
    rootEventId: string,
  ): Promise<Result<readonly Comment[], SocialFetchError>> {
    if (this.relayPool.getConnectedRelayCount() === 0) {
      return err(new SocialFetchError('No relays connected'));
    }

    const normalized = rootEventId.trim().toLowerCase();
    try {
      const events = await this.gateway.query(
        [{kinds: [COMMENT_KIND], '#E': [normalized], limit: 200}],
        {timeoutMs: this.queryTimeoutMs},
      );

      const comments: Comment[] = [];
      const seen = new Set<string>();
      for (const event of events) {
        if (seen.has(event.id)) {
          continue;
        }
        seen.add(event.id);
        const mapped = Kind1111Mapper.fromEvent(event);
        if (mapped.ok && mapped.value.rootEventId === normalized) {
          comments.push(mapped.value);
        }
      }
      return ok(comments);
    } catch (cause) {
      return err(new SocialFetchError('Failed to fetch comments from relays', {cause}));
    }
  }

  async publish(event: SignedNostrEvent): Promise<Result<void, SocialPublishError>> {
    try {
      const results = await this.gateway.publish(event);
      if (results.some(result => result.accepted)) {
        return ok(undefined);
      }
      const message =
        results.find(result => result.message)?.message ??
        'No relay accepted the social event';
      return err(new SocialPublishError(message));
    } catch (cause) {
      return err(new SocialPublishError('Failed to publish social event', {cause}));
    }
  }
}
