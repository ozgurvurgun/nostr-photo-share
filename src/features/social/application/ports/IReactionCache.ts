import type {ReactionSummary} from '../../domain/Reaction';

export type CachedReactionSummary = {
  readonly summary: ReactionSummary;
  readonly fetchedAt: number;
};

export interface IReactionCache {
  get(eventId: string): CachedReactionSummary | null;
  set(eventId: string, summary: ReactionSummary): void;
  setMany(summaries: readonly ReactionSummary[]): void;
  clear(): void;
}
