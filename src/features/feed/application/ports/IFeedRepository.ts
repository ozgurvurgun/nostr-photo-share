import type {SignedNostrEvent} from '../../../../infrastructure/nostr/protocol/event';
import type {Result} from '../../../../core/result/Result';
import type {FeedFetchError, FeedPublishError} from '../../domain/errors';
import type {ImagePost} from '../../domain/ImagePost';

export type FeedPageQuery = {
  /** Inclusive upper bound on created_at (NIP-01 `until`). Skip already-seen ids client-side. */
  readonly until?: number;
  readonly limit: number;
  /** When set, restrict to these authors (follow-graph feed). */
  readonly authors?: readonly string[];
};

export type FeedPage = {
  readonly posts: readonly ImagePost[];
  /**
   * Pass as `until` for the next page, or null when no further page is expected.
   * Derived from the oldest post in this page (inclusive).
   */
  readonly nextUntil: number | null;
};

export interface IFeedRepository {
  fetchPage(query: FeedPageQuery): Promise<Result<FeedPage, FeedFetchError>>;
  publish(event: SignedNostrEvent): Promise<Result<void, FeedPublishError>>;
}
