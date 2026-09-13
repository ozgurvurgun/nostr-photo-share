import {ok, type Result} from '../../../core/result/Result';
import type {SocialFetchError} from '../domain/errors';
import {
  emptyReactionSummary,
  summarizeLikes,
  type ReactionSummary,
} from '../domain/Reaction';
import type {IReactionCache} from './ports/IReactionCache';
import type {ISocialRepository} from './ports/ISocialRepository';

export type GetPostReactionsResult = {
  readonly summaries: readonly ReactionSummary[];
  readonly fromCache: boolean;
};

/**
 * Aggregates NIP-25 likes for one or many event ids.
 */
export class GetPostReactionsUseCase {
  constructor(
    private readonly repository: ISocialRepository,
    private readonly cache: IReactionCache,
  ) {}

  async execute(
    eventIds: readonly string[],
    viewerPubkeyHex: string | null,
  ): Promise<Result<GetPostReactionsResult, SocialFetchError>> {
    const normalized = [
      ...new Set(eventIds.map(id => id.trim().toLowerCase()).filter(id => id.length > 0)),
    ];
    if (normalized.length === 0) {
      return ok({summaries: [], fromCache: false});
    }

    const fetchResult = await this.repository.fetchReactionsForEvents(normalized);
    if (!fetchResult.ok) {
      const cached = normalized
        .map(id => this.cache.get(id)?.summary)
        .filter((summary): summary is ReactionSummary => summary !== undefined);
      if (cached.length > 0) {
        return ok({summaries: cached, fromCache: true});
      }
      return fetchResult;
    }

    const summaries = normalized.map(eventId =>
      summarizeLikes(eventId, fetchResult.value, viewerPubkeyHex),
    );
    this.cache.setMany(summaries);
    return ok({summaries, fromCache: false});
  }

  getCached(eventId: string): ReactionSummary {
    return this.cache.get(eventId)?.summary ?? emptyReactionSummary(eventId);
  }
}
