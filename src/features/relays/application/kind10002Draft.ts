import type {SignableEvent} from '../../auth/application/ports/ISigner';
import type {RelayPreference} from '../domain/RelayPreference';
import {RELAY_LIST_KIND} from '../domain/kinds';

/**
 * Builds an unsigned NIP-65 kind:10002 relay list event.
 * Marker omitted when both read and write; otherwise "read" | "write".
 */
export function buildKind10002UnsignedEvent(input: {
  readonly preferences: readonly RelayPreference[];
  readonly createdAt?: number;
}): SignableEvent {
  const tags: (readonly string[])[] = input.preferences.map(pref => {
    if (pref.read && pref.write) {
      return ['r', pref.url];
    }
    if (pref.read) {
      return ['r', pref.url, 'read'];
    }
    return ['r', pref.url, 'write'];
  });

  return {
    kind: RELAY_LIST_KIND,
    created_at: input.createdAt ?? Math.floor(Date.now() / 1000),
    tags,
    content: '',
  };
}
