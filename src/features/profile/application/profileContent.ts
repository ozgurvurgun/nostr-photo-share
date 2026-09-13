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

export function parseKind0Content(content: string): Kind0Json | null {
  try {
    const parsed: unknown = JSON.parse(content);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Kind0Json;
  } catch {
    return null;
  }
}

/** Serialize profile edit fields to kind:0 content JSON (no protocol event fields). */
export function profileUpdateToKind0Content(input: ProfileUpdateInput): string {
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
}

export function profileFromKind0Content(
  pubkeyHex: string,
  content: string,
  meta: {readonly eventId: string; readonly createdAt: number},
): Profile {
  const normalized = pubkeyHex.trim().toLowerCase();
  const json = parseKind0Content(content);
  if (json === null) {
    return {
      ...emptyProfile(normalized),
      eventId: meta.eventId,
      createdAt: meta.createdAt,
      nip05Status: 'unverified',
    };
  }

  const name = asString(json.name) || asString(json.username);
  const displayName = asString(json.display_name) || asString(json.displayName);
  const nip05Raw = asString(json.nip05).trim();

  return {
    pubkeyHex: normalized,
    name,
    displayName,
    about: asString(json.about),
    picture: asString(json.picture),
    nip05: nip05Raw.length > 0 ? nip05Raw : null,
    website: asString(json.website),
    banner: asString(json.banner),
    nip05Status: nip05Raw.length > 0 ? 'unverified' : 'none',
    eventId: meta.eventId,
    createdAt: meta.createdAt,
  };
}

export function profileFromUpdateInput(
  pubkeyHex: string,
  input: ProfileUpdateInput,
  meta: {readonly eventId: string; readonly createdAt: number},
): Profile {
  const nip05 = input.nip05.trim();
  return {
    pubkeyHex: pubkeyHex.trim().toLowerCase(),
    name: input.name.trim(),
    displayName: input.displayName.trim(),
    about: input.about.trim(),
    picture: input.picture.trim(),
    nip05: nip05.length > 0 ? nip05 : null,
    website: (input.website ?? '').trim(),
    banner: (input.banner ?? '').trim(),
    nip05Status: nip05.length > 0 ? 'unverified' : 'none',
    eventId: meta.eventId,
    createdAt: meta.createdAt,
  };
}
