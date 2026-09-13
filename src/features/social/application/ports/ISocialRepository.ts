import type {Result} from '../../../../core/result/Result';
import type {SignedNostrEvent} from '../../../../infrastructure/nostr/protocol/event';
import type {Comment} from '../../domain/Comment';
import type {FollowList} from '../../domain/FollowList';
import type {Reaction} from '../../domain/Reaction';
import type {SocialFetchError, SocialPublishError} from '../../domain/errors';

export interface ISocialRepository {
  fetchFollowList(ownerPubkeyHex: string): Promise<Result<FollowList, SocialFetchError>>;
  fetchReactionsForEvents(
    eventIds: readonly string[],
  ): Promise<Result<readonly Reaction[], SocialFetchError>>;
  fetchCommentsForRoot(
    rootEventId: string,
  ): Promise<Result<readonly Comment[], SocialFetchError>>;
  publish(event: SignedNostrEvent): Promise<Result<void, SocialPublishError>>;
}
