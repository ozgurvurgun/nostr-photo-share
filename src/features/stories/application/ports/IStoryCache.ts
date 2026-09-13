import type {Story} from '../../domain/Story';

export type CachedStoriesSnapshot = {
  readonly stories: readonly Story[];
  readonly updatedAt: number;
};

export interface IStoryCache {
  get(): CachedStoriesSnapshot | null;
  /** Merge stories by id; keep newest created_at ordering. */
  merge(stories: readonly Story[]): CachedStoriesSnapshot;
  clear(): void;
}
