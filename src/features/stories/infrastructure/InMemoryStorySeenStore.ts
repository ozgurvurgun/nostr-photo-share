import type {IStorySeenStore} from '../application/ports/IStorySeenStore';

/** V1 in-memory seen store — used in tests; production uses KeychainStorySeenStore. */
export class InMemoryStorySeenStore implements IStorySeenStore {
  private readonly seen = new Set<string>();

  hasSeen(storyId: string): boolean {
    return this.seen.has(storyId.trim().toLowerCase());
  }

  markSeen(storyId: string): void {
    const normalized = storyId.trim().toLowerCase();
    if (normalized.length > 0) {
      this.seen.add(normalized);
    }
  }

  getSeenIds(): ReadonlySet<string> {
    return new Set(this.seen);
  }

  clear(): void {
    this.seen.clear();
  }
}
