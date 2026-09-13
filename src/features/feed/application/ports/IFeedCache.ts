import type {ImagePost} from '../../domain/ImagePost';

export type CachedFeedSnapshot = {
  readonly posts: readonly ImagePost[];
  readonly updatedAt: number;
};

export interface IFeedCache {
  get(): CachedFeedSnapshot | null;
  /** Merge posts by id; keep newest created_at ordering. */
  merge(posts: readonly ImagePost[]): CachedFeedSnapshot;
  clear(): void;
}
