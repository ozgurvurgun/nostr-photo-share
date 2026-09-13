import type {SignedNostrEvent} from '../../../../infrastructure/nostr/protocol/event';
import type {RelayList} from '../../domain/RelayList';
import type {RelayListFetchError, RelayListPublishError} from '../../domain/errors';
import type {Result} from '../../../../core/result/Result';

export interface IRelayListRepository {
  fetchRelayList(
    ownerPubkeyHex: string,
  ): Promise<Result<RelayList, RelayListFetchError>>;
  /** Batch-fetch NIP-65 lists for many authors (outbox discovery). */
  fetchRelayLists(
    ownerPubkeyHexes: readonly string[],
  ): Promise<Result<readonly RelayList[], RelayListFetchError>>;
  /**
   * @param relayUrls When provided, publish only to these URLs (old∪new write set).
   * When omitted, uses gateway default write routing.
   */
  publish(
    event: SignedNostrEvent,
    relayUrls?: readonly string[],
  ): Promise<Result<void, RelayListPublishError>>;
}
