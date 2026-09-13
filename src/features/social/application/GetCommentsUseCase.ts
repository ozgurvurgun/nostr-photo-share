import {ok, type Result} from '../../../core/result/Result';
import type {Comment} from '../domain/Comment';
import type {SocialFetchError} from '../domain/errors';
import type {ICommentCache} from './ports/ICommentCache';
import type {ISocialRepository} from './ports/ISocialRepository';

export type GetCommentsResult = {
  readonly comments: readonly Comment[];
  readonly fromCache: boolean;
};

function compareCommentsOldestFirst(a: Comment, b: Comment): number {
  if (a.createdAt !== b.createdAt) {
    return a.createdAt - b.createdAt;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Loads NIP-22 comments for a root picture event id.
 */
export class GetCommentsUseCase {
  constructor(
    private readonly repository: ISocialRepository,
    private readonly cache: ICommentCache,
  ) {}

  async execute(
    rootEventId: string,
  ): Promise<Result<GetCommentsResult, SocialFetchError>> {
    const normalized = rootEventId.trim().toLowerCase();
    const cached = this.cache.get(normalized);

    const fetchResult = await this.repository.fetchCommentsForRoot(normalized);
    if (!fetchResult.ok) {
      if (cached !== null) {
        return ok({comments: cached.comments, fromCache: true});
      }
      return fetchResult;
    }

    const sorted = [...fetchResult.value].sort(compareCommentsOldestFirst);
    this.cache.set(normalized, sorted);
    return ok({comments: sorted, fromCache: false});
  }

  getCached(rootEventId: string): readonly Comment[] {
    return this.cache.get(rootEventId.trim().toLowerCase())?.comments ?? [];
  }
}
