import type {SignedNostrEvent} from '../../../infrastructure/nostr/protocol/event';
import {
  emptyProfile,
  type Profile,
  type ProfileUpdateInput,
} from '../domain/Profile';

type Kind0Json = {
  readonly name?: unknown;
  readonly display_name?: unknown;
  readonly displayName?: unknown;
  readonly username?: unknown;
  readonly about?: unknown;
  readonly picture?: unknown;
  readonly nip05?: unknown;
  readonly website?: unknown;
  readonly banner?: unknown;
};

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Maps kind:0 event content ↔ Profile.
 * Ignores invalid JSON safely. Deprecated displayName/username are fallbacks only.
 */
export const Kind0ProfileMapper = {
  parseContent(content: string): Kind0Json | null {
    try {
      const parsed: unknown = JSON.parse(content);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return null;
      }
      return parsed as Kind0Json;
    } catch {
      return null;
    }
  },

  fromEvent(event: SignedNostrEvent): Profile {
    const pubkeyHex = event.pubkey.trim().toLowerCase();
    const json = this.parseContent(event.content);
    if (json === null) {
      return {
        ...emptyProfile(pubkeyHex),
        eventId: event.id,
        createdAt: event.created_at,
        nip05Status: 'unverified',
      };
    }

    const name = asString(json.name) || asString(json.username);
    const displayName = asString(json.display_name) || asString(json.displayName);
    const nip05Raw = asString(json.nip05).trim();

    return {
      pubkeyHex,
      name,
      displayName,
      about: asString(json.about),
      picture: asString(json.picture),
      nip05: nip05Raw.length > 0 ? nip05Raw : null,
      website: asString(json.website),
      banner: asString(json.banner),
      nip05Status: nip05Raw.length > 0 ? 'unverified' : 'none',
      eventId: event.id,
      createdAt: event.created_at,
    };
  },

  toContentJson(input: ProfileUpdateInput): string {
    const payload: Record<string, string> = {};
    const name = input.name.trim();
    const displayName = input.displayName.trim();
    const about = input.about.trim();
    const picture = input.picture.trim();
    const nip05 = input.nip05.trim();
    const website = (input.website ?? '').trim();
    const banner = (input.banner ?? '').trim();

    if (name.length > 0) {
      payload.name = name;
    }
    if (displayName.length > 0) {
      payload.display_name = displayName;
    }
    if (about.length > 0) {
      payload.about = about;
    }
    if (picture.length > 0) {
      payload.picture = picture;
    }
    if (nip05.length > 0) {
      payload.nip05 = nip05;
    }
    if (website.length > 0) {
      payload.website = website;
    }
    if (banner.length > 0) {
      payload.banner = banner;
    }

    return JSON.stringify(payload);
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
