import type {ImagePost} from '../domain/ImagePost';
import type {CachedFeedSnapshot, IFeedCache} from '../application/ports/IFeedCache';

/** Keep newest N posts in memory to bound session growth. */
export const FEED_CACHE_MAX_POSTS = 300;

function comparePostsNewestFirst(a: ImagePost, b: ImagePost): number {
  if (a.createdAt !== b.createdAt) {
    return b.createdAt - a.createdAt;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export class InMemoryFeedCache implements IFeedCache {
  constructor(private readonly maxPosts: number = FEED_CACHE_MAX_POSTS) {}

  private snapshot: CachedFeedSnapshot | null = null;

  get(): CachedFeedSnapshot | null {
    return this.snapshot;
  }

  merge(posts: readonly ImagePost[]): CachedFeedSnapshot {
    const byId = new Map<string, ImagePost>();
    if (this.snapshot !== null) {
      for (const post of this.snapshot.posts) {
        byId.set(post.id, post);
      }
    }
    for (const post of posts) {
      byId.set(post.id, post);
    }
    const merged = [...byId.values()]
      .sort(comparePostsNewestFirst)
      .slice(0, Math.max(1, this.maxPosts));
    this.snapshot = {
      posts: merged,
      updatedAt: Date.now(),
    };
    return this.snapshot;
  }

  clear(): void {
    this.snapshot = null;
  }
}
