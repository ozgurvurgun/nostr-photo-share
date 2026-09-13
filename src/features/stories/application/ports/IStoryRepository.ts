import type {SignedNostrEvent} from '../../../../infrastructure/nostr/protocol/event';
import type {Result} from '../../../../core/result/Result';
import type {StoryFetchError, StoryPublishError} from '../../domain/errors';
import type {Story} from '../../domain/Story';

export type ActiveStoriesQuery = {
  /** When set, restrict to these authors (follow graph + self). */
  readonly authors?: readonly string[];
  readonly limit: number;
};

export interface IStoryRepository {
  fetchActive(query: ActiveStoriesQuery): Promise<Result<readonly Story[], StoryFetchError>>;
  publish(event: SignedNostrEvent): Promise<Result<void, StoryPublishError>>;
}
