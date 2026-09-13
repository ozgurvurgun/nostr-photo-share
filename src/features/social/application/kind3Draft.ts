import type {SignableEvent} from '../../auth/application/ports/ISigner';
import type {ContactEntry} from '../domain/FollowList';
import {FOLLOW_LIST_KIND} from '../domain/kinds';

/**
 * Builds an unsigned NIP-02 kind:3 contact list event.
 * Full list is republished on every change; order preserved (append follows at end).
 */
export function buildKind3UnsignedEvent(input: {
  readonly contacts: readonly ContactEntry[];
  readonly createdAt?: number;
}): SignableEvent {
  const tags: (readonly string[])[] = input.contacts.map(contact => {
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

  return {
    kind: FOLLOW_LIST_KIND,
    created_at: input.createdAt ?? Math.floor(Date.now() / 1000),
    tags,
    content: '',
  };
}
