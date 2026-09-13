import type {ReactionSummary} from '../domain/Reaction';
import type {CachedReactionSummary, IReactionCache} from '../application/ports/IReactionCache';

export class InMemoryReactionCache implements IReactionCache {
  private readonly entries = new Map<string, CachedReactionSummary>();

  get(eventId: string): CachedReactionSummary | null {
    return this.entries.get(eventId.trim().toLowerCase()) ?? null;
  }

  set(eventId: string, summary: ReactionSummary): void {
    const key = eventId.trim().toLowerCase();
    this.entries.set(key, {
      summary: {...summary, targetEventId: key},
      fetchedAt: Date.now(),
    });
  }

  setMany(summaries: readonly ReactionSummary[]): void {
    for (const summary of summaries) {
      this.set(summary.targetEventId, summary);
    }
  }

  clear(): void {
    this.entries.clear();
  }
}
