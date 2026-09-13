import {err, ok, type Result} from '../../../core/result/Result';
import type {SignedNostrEvent} from '../../../infrastructure/nostr/protocol/event';
import {InvalidRelayListError} from '../domain/errors';
import {RELAY_LIST_KIND} from '../domain/kinds';
import {RelayList} from '../domain/RelayList';
import type {RelayPreference} from '../domain/RelayPreference';
import {normalizeRelayUrl} from '../domain/RelayUrl';

/**
 * Maps NIP-65 kind:10002 events ↔ RelayList.
 */
export const Kind10002Mapper = {
  fromEvent(event: SignedNostrEvent): Result<RelayList, InvalidRelayListError> {
    if (event.kind !== RELAY_LIST_KIND) {
      return err(new InvalidRelayListError(`Expected kind ${RELAY_LIST_KIND}`));
    }

    const byUrl = new Map<string, {read: boolean; write: boolean}>();
    for (const tag of event.tags) {
      if (tag[0] !== 'r' || !tag[1]) {
        continue;
      }
      const urlResult = normalizeRelayUrl(tag[1]);
      if (!urlResult.ok) {
        continue;
      }
      const url = urlResult.value;
      const marker = tag[2]?.trim().toLowerCase();
      let read = true;
      let write = true;
      if (marker === 'read') {
        write = false;
      } else if (marker === 'write') {
        read = false;
      } else if (marker !== undefined && marker.length > 0) {
        // Unknown marker — treat as both (lenient).
        read = true;
        write = true;
      }

      const existing = byUrl.get(url);
      if (existing !== undefined) {
        byUrl.set(url, {
          read: existing.read || read,
          write: existing.write || write,
        });
      } else {
        byUrl.set(url, {read, write});
      }
    }

    const preferences: RelayPreference[] = [...byUrl.entries()].map(([url, flags]) => ({
      url,
      read: flags.read,
      write: flags.write,
    }));

    return RelayList.create({
      ownerPubkeyHex: event.pubkey,
      preferences,
      eventId: event.id,
      createdAt: event.created_at,
    });
  },

  /** Builds `r` tags from preferences. */
  toTags(preferences: readonly RelayPreference[]): (readonly string[])[] {
    return preferences.map(pref => {
      if (pref.read && pref.write) {
        return ['r', pref.url];
      }
      if (pref.read) {
        return ['r', pref.url, 'read'];
      }
      return ['r', pref.url, 'write'];
    });
  },

  /**
   * Latest replaceable event: highest created_at, then lowest id (NIP-01).
   */
  pickLatestReplaceable(events: readonly SignedNostrEvent[]): SignedNostrEvent | null {
    if (events.length === 0) {
      return null;
    }

    let best = events[0]!;
    for (let i = 1; i < events.length; i += 1) {
      const candidate = events[i]!;
      if (candidate.created_at > best.created_at) {
        best = candidate;
        continue;
      }
      if (candidate.created_at === best.created_at && candidate.id < best.id) {
        best = candidate;
      }
    }
    return best;
  },
} as const;
