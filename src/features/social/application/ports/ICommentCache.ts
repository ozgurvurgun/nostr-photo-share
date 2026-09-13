import type {Comment} from '../../domain/Comment';

export type CachedComments = {
  readonly comments: readonly Comment[];
  readonly fetchedAt: number;
};

export interface ICommentCache {
  get(rootEventId: string): CachedComments | null;
  set(rootEventId: string, comments: readonly Comment[]): void;
  clear(): void;
}
