import {ok, type Result} from '../../../core/result/Result';
import type {FeedFetchError} from '../domain/errors';
import type {ImagePost} from '../domain/ImagePost';
import type {IFeedCache} from './ports/IFeedCache';
import type {FeedPage, FeedPageQuery, IFeedRepository} from './ports/IFeedRepository';

export type GetFeedPageResult = FeedPage & {
  /** True when the page came from cache after a fetch failure. */
  readonly fromCache: boolean;
};

/**
 * Loads a page of kind:20 picture posts, merging into the local feed cache.
 * On fetch failure, returns cached posts for the first page when available.
 */
export class GetFeedPageUseCase {
  constructor(
    private readonly repository: IFeedRepository,
    private readonly cache: IFeedCache,
  ) {}

  async execute(query: FeedPageQuery): Promise<Result<GetFeedPageResult, FeedFetchError>> {
    const fetchResult = await this.repository.fetchPage(query);
    if (!fetchResult.ok) {
      const isFirstPage = query.until === undefined;
      const cached = this.cache.get();
      if (isFirstPage && cached !== null && cached.posts.length > 0) {
        const pagePosts = filterCached(cached.posts, query).slice(0, query.limit);
        return ok({
          posts: pagePosts,
          nextUntil: deriveNextUntil(pagePosts, query.limit),
          fromCache: true,
        });
      }
      return fetchResult;
    }

    this.cache.merge(fetchResult.value.posts);

    // Keep cursor aligned with the fetched page (not a cache-merged view) so
    // locally published posts do not skip events on page 2.
    const pagePosts = fetchResult.value.posts;
    return ok({
      posts: pagePosts,
      nextUntil: fetchResult.value.nextUntil ?? deriveNextUntil(pagePosts, query.limit),
      fromCache: false,
    });
  }

  getCachedPosts(): readonly ImagePost[] {
    return this.cache.get()?.posts ?? [];
  }
}

function filterCached(posts: readonly ImagePost[], query: FeedPageQuery): ImagePost[] {
  let filtered = [...posts];
  if (query.authors !== undefined && query.authors.length > 0) {
    const allowed = new Set(query.authors.map(a => a.trim().toLowerCase()));
    filtered = filtered.filter(post => allowed.has(post.authorPubkeyHex));
  }
  if (query.until !== undefined) {
    filtered = filtered.filter(post => post.createdAt <= query.until!);
  }
  return filtered;
}

function deriveNextUntil(posts: readonly ImagePost[], limit: number): number | null {
  if (posts.length < limit || posts.length === 0) {
    return null;
  }
  return posts[posts.length - 1]!.createdAt;
}
