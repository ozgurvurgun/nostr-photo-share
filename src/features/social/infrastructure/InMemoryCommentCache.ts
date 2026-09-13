import type {Comment} from '../domain/Comment';
import type {CachedComments, ICommentCache} from '../application/ports/ICommentCache';

export class InMemoryCommentCache implements ICommentCache {
  private readonly entries = new Map<string, CachedComments>();

  get(rootEventId: string): CachedComments | null {
    return this.entries.get(rootEventId.trim().toLowerCase()) ?? null;
  }

  set(rootEventId: string, comments: readonly Comment[]): void {
    const key = rootEventId.trim().toLowerCase();
    this.entries.set(key, {
      comments,
      fetchedAt: Date.now(),
    });
  }

  clear(): void {
    this.entries.clear();
  }
}
