import {ok, type Result} from '../../../core/result/Result';
import type {FollowList} from '../domain/FollowList';
import type {SocialFetchError} from '../domain/errors';
import type {IFollowCache} from './ports/IFollowCache';
import type {ISocialRepository} from './ports/ISocialRepository';

/**
 * Loads the viewer's kind:3 contact list, preferring cache after a fetch failure.
 */
export class GetFollowListUseCase {
  constructor(
    private readonly repository: ISocialRepository,
    private readonly cache: IFollowCache,
  ) {}

  async execute(ownerPubkeyHex: string): Promise<Result<FollowList, SocialFetchError>> {
    const normalized = ownerPubkeyHex.trim().toLowerCase();
    const cached = this.cache.get(normalized);

    const fetchResult = await this.repository.fetchFollowList(normalized);
    if (!fetchResult.ok) {
      if (cached !== null) {
        return ok(cached.list);
      }
      return fetchResult;
    }

    this.cache.set(normalized, fetchResult.value);
    return ok(fetchResult.value);
  }

  getCached(ownerPubkeyHex: string): FollowList | null {
    return this.cache.get(ownerPubkeyHex.trim().toLowerCase())?.list ?? null;
  }
}
