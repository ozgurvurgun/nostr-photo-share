import {
  finalizeEvent,
  generateSecretKey,
  getEventHash,
  getPublicKey,
  verifyEvent,
  type Event,
  type EventTemplate,
  type UnsignedEvent,
} from 'nostr-tools/pure';
import type {SignedNostrEvent, UnsignedNostrEvent} from '../protocol/event';

function toMutableTags(tags: readonly (readonly string[])[]): string[][] {
  return tags.map(tag => [...tag]);
}

function toUnsignedEvent(event: UnsignedNostrEvent & {readonly pubkey: string}): UnsignedEvent {
  return {
    pubkey: event.pubkey,
    created_at: event.created_at,
    kind: event.kind,
    tags: toMutableTags(event.tags),
    content: event.content,
  };
}

function toToolsEvent(event: SignedNostrEvent): Event {
  return {
    id: event.id,
    pubkey: event.pubkey,
    created_at: event.created_at,
    kind: event.kind,
    tags: toMutableTags(event.tags),
    content: event.content,
    sig: event.sig,
  };
}

function fromToolsEvent(event: Event): SignedNostrEvent {
  return {
    id: event.id,
    pubkey: event.pubkey,
    created_at: event.created_at,
    kind: event.kind,
    tags: event.tags,
    content: event.content,
    sig: event.sig,
  };
}

export const nostrToolsCryptoAdapter = {
  generateSecretKey(): Uint8Array {
    return generateSecretKey();
  },

  getPublicKey(secretKey: Uint8Array): string {
    return getPublicKey(secretKey);
  },

  getEventHash(event: UnsignedNostrEvent & {readonly pubkey: string}): string {
    return getEventHash(toUnsignedEvent(event));
  },

  verifyEvent(event: SignedNostrEvent): boolean {
    return verifyEvent(toToolsEvent(event));
  },

  finalizeEvent(template: UnsignedNostrEvent, secretKey: Uint8Array): SignedNostrEvent {
    const eventTemplate: EventTemplate = {
      created_at: template.created_at,
      kind: template.kind,
      tags: toMutableTags(template.tags),
      content: template.content,
    };
    return fromToolsEvent(finalizeEvent(eventTemplate, secretKey));
  },
};
