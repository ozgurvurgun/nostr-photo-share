/** One relay entry in a NIP-65 preference list. */
export type RelayPreference = {
  readonly url: string;
  readonly read: boolean;
  readonly write: boolean;
};

export type RelayMarker = 'read' | 'write' | 'both';

export function relayMarker(pref: RelayPreference): RelayMarker {
  if (pref.read && pref.write) {
    return 'both';
  }
  if (pref.read) {
    return 'read';
  }
  return 'write';
}

/** Pool / publish helpers from preferences. */
export function preferenceUrls(
  preferences: readonly RelayPreference[],
  mode: 'all' | 'read' | 'write' = 'all',
): readonly string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const pref of preferences) {
    const include =
      mode === 'all'
        ? pref.read || pref.write
        : mode === 'read'
          ? pref.read
          : pref.write;
    if (!include || seen.has(pref.url)) {
      continue;
    }
    seen.add(pref.url);
    urls.push(pref.url);
  }
  return urls;
}
