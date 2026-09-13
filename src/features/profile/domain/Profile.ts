export type Nip05Status = 'none' | 'unverified' | 'verified' | 'failed';

export type Profile = {
  readonly pubkeyHex: string;
  /** Username — kind:0 `name` (NIP-24). */
  readonly name: string;
  /** Display name — kind:0 `display_name`. */
  readonly displayName: string;
  readonly about: string;
  /** Avatar URL (V1: URL string only). */
  readonly picture: string;
  readonly nip05: string | null;
  readonly website: string;
  readonly banner: string;
  readonly nip05Status: Nip05Status;
  readonly eventId: string | null;
  readonly createdAt: number | null;
};

export type ProfileUpdateInput = {
  readonly name: string;
  readonly displayName: string;
  readonly about: string;
  readonly picture: string;
  readonly nip05: string;
  readonly website?: string;
  readonly banner?: string;
};

export function emptyProfile(pubkeyHex: string): Profile {
  return {
    pubkeyHex: pubkeyHex.trim().toLowerCase(),
    name: '',
    displayName: '',
    about: '',
    picture: '',
    nip05: null,
    website: '',
    banner: '',
    nip05Status: 'none',
    eventId: null,
    createdAt: null,
  };
}

export function isProfileContentEmpty(profile: Profile): boolean {
  return (
    profile.name.length === 0 &&
    profile.displayName.length === 0 &&
    profile.about.length === 0 &&
    profile.picture.length === 0 &&
    (profile.nip05 === null || profile.nip05.length === 0) &&
    profile.eventId === null
  );
}

export function withNip05Status(profile: Profile, nip05Status: Nip05Status): Profile {
  return {...profile, nip05Status};
}
