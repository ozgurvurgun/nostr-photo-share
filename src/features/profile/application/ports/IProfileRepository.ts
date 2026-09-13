import type {Result} from '../../../../core/result/Result';
import type {SignedNostrEvent} from '../../../../infrastructure/nostr/protocol/event';
import type {ProfileFetchError, ProfilePublishError} from '../../domain/errors';
import type {Profile} from '../../domain/Profile';

export interface IProfileRepository {
  fetchByPubkey(pubkeyHex: string): Promise<Result<Profile, ProfileFetchError>>;
  publish(event: SignedNostrEvent): Promise<Result<void, ProfilePublishError>>;
}
