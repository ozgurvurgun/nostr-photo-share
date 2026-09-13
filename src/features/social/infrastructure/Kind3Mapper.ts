import {err, ok, type Result} from '../../../core/result/Result';
import type {SignedNostrEvent} from '../../../infrastructure/nostr/protocol/event';
import type {ContactEntry} from '../domain/FollowList';
import {FollowList} from '../domain/FollowList';
import {InvalidFollowListError} from '../domain/errors';
import {FOLLOW_LIST_KIND} from '../domain/kinds';

/**
 * Maps NIP-02 kind:3 events ↔ FollowList.
 * Follow/unfollow list mutations preserve order (append on follow).
 */
export const Kind3Mapper = {
  fromEvent(event: SignedNostrEvent): Result<FollowList, InvalidFollowListError> {
    if (event.kind !== FOLLOW_LIST_KIND) {
      return err(new InvalidFollowListError(`Expected kind ${FOLLOW_LIST_KIND}`));
    }

    const contacts: ContactEntry[] = [];
    for (const tag of event.tags) {
      if (tag[0] !== 'p' || !tag[1]) {
        continue;
      }
      const pubkeyHex = tag[1].trim().toLowerCase();
      if (!/^[0-9a-f]{64}$/.test(pubkeyHex)) {
        continue;
      }
      const relayUrl = tag[2]?.trim();
      const petname = tag[3]?.trim();
      contacts.push({
        pubkeyHex,
        ...(relayUrl && relayUrl.length > 0 ? {relayUrl} : {}),
        ...(petname && petname.length > 0 ? {petname} : {}),
      });
    }

    return FollowList.create({
      ownerPubkeyHex: event.pubkey,
      contacts,
      eventId: event.id,
      createdAt: event.created_at,
    });
  },

  /** Builds `p` tags from contacts; order preserved. */
  toTags(contacts: readonly ContactEntry[]): (readonly string[])[] {
    return contacts.map(contact => {
      const tag: string[] = ['p', contact.pubkeyHex.trim().toLowerCase()];
      if (contact.relayUrl && contact.relayUrl.trim().length > 0) {
        tag.push(contact.relayUrl.trim());
        if (contact.petname && contact.petname.trim().length > 0) {
          tag.push(contact.petname.trim());
        }
      } else if (contact.petname && contact.petname.trim().length > 0) {
        tag.push('');
        tag.push(contact.petname.trim());
      }
      return tag;
    });
  },

  /**
   * Appends a follow at the end if not already present.
   * Returns the new contact list (does not mutate input).
   */
  withFollow(
    contacts: readonly ContactEntry[],
    entry: ContactEntry,
  ): readonly ContactEntry[] {
    const pubkeyHex = entry.pubkeyHex.trim().toLowerCase();
    if (contacts.some(contact => contact.pubkeyHex === pubkeyHex)) {
      return contacts;
    }
    return [
      ...contacts,
      {
        pubkeyHex,
        ...(entry.relayUrl?.trim() ? {relayUrl: entry.relayUrl.trim()} : {}),
        ...(entry.petname?.trim() ? {petname: entry.petname.trim()} : {}),
      },
    ];
  },

  /** Removes a follow by pubkey; preserves remaining order. */
  withoutFollow(
    contacts: readonly ContactEntry[],
    pubkeyHex: string,
  ): readonly ContactEntry[] {
    const target = pubkeyHex.trim().toLowerCase();
    return contacts.filter(contact => contact.pubkeyHex !== target);
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
