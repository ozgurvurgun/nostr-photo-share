import {err, ok, type Result} from '../../../core/result/Result';
import type {NostrGateway} from '../../../infrastructure/nostr/gateway/NostrGateway';
import type {SignedNostrEvent} from '../../../infrastructure/nostr/protocol/event';
import type {RelayPool} from '../../../infrastructure/nostr/relay/RelayPool';
import type {IRelayListRepository} from '../application/ports/IRelayListRepository';
import {RelayList} from '../domain/RelayList';
import {RelayListFetchError, RelayListPublishError} from '../domain/errors';
import {RELAY_LIST_KIND} from '../domain/kinds';
import {Kind10002Mapper} from './Kind10002Mapper';

/**
 * NIP-65 kind:10002 via NostrGateway.
 * Fails fetch when zero relays are connected.
 */
export class NostrRelayListRepository implements IRelayListRepository {
  constructor(
    private readonly gateway: NostrGateway,
    private readonly queryTimeoutMs: number,
    private readonly relayPool: RelayPool,
  ) {}

  async fetchRelayList(
    ownerPubkeyHex: string,
  ): Promise<Result<RelayList, RelayListFetchError>> {
    const batch = await this.fetchRelayLists([ownerPubkeyHex]);
    if (!batch.ok) {
      return batch;
    }
    const normalized = ownerPubkeyHex.trim().toLowerCase();
    const found = batch.value.find(list => list.ownerPubkeyHex === normalized);
    if (found !== undefined) {
      return ok(found);
    }
    const empty = RelayList.empty(normalized);
    if (!empty.ok) {
      return err(new RelayListFetchError(empty.error.message));
    }
    return ok(empty.value);
  }

  async fetchRelayLists(
    ownerPubkeyHexes: readonly string[],
  ): Promise<Result<readonly RelayList[], RelayListFetchError>> {
    if (this.relayPool.getConnectedRelayCount() === 0) {
      return err(new RelayListFetchError('No relays connected'));
    }

    const normalized = [
      ...new Set(
        ownerPubkeyHexes
          .map(pubkey => pubkey.trim().toLowerCase())
          .filter(pubkey => /^[0-9a-f]{64}$/.test(pubkey)),
      ),
    ];
    if (normalized.length === 0) {
      return ok([]);
    }

    try {
      const events = await this.gateway.query(
        [
          {
            kinds: [RELAY_LIST_KIND],
            authors: normalized,
            limit: Math.min(500, normalized.length * 5),
          },
        ],
        {timeoutMs: this.queryTimeoutMs},
      );

      const byAuthor = new Map<string, SignedNostrEvent[]>();
      for (const event of events) {
        if (event.kind !== RELAY_LIST_KIND) {
          continue;
        }
        const author = event.pubkey.trim().toLowerCase();
        if (!normalized.includes(author)) {
          continue;
        }
        const bucket = byAuthor.get(author) ?? [];
        bucket.push(event);
        byAuthor.set(author, bucket);
      }

      const lists: RelayList[] = [];
      for (const author of normalized) {
        const latest = Kind10002Mapper.pickLatestReplaceable(byAuthor.get(author) ?? []);
        if (latest === null) {
          const empty = RelayList.empty(author);
          if (empty.ok) {
            lists.push(empty.value);
          }
          continue;
        }
        const mapped = Kind10002Mapper.fromEvent(latest);
        if (mapped.ok) {
          lists.push(mapped.value);
        }
      }
      return ok(lists);
    } catch (cause) {
      return err(new RelayListFetchError('Failed to fetch relay lists from relays', {cause}));
    }
  }

  async publish(
    event: SignedNostrEvent,
    relayUrls?: readonly string[],
  ): Promise<Result<void, RelayListPublishError>> {
    try {
      const results =
        relayUrls !== undefined && relayUrls.length > 0
          ? await this.gateway.publishTo(event, relayUrls)
          : await this.gateway.publish(event);
      if (results.some(result => result.accepted)) {
        return ok(undefined);
      }
      const message =
        results.find(result => result.message)?.message ??
        'No relay accepted the relay list event';
      return err(new RelayListPublishError(message));
    } catch (cause) {
      return err(new RelayListPublishError('Failed to publish relay list', {cause}));
    }
  }
}
