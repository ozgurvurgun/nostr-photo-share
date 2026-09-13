import {ok} from '../../../core/result/Result';
import type {ISigner, SignableEvent, SignedEvent} from '../../auth/application/ports/ISigner';
import {BLOSSOM_AUTH_KIND, buildBlossomUploadAuthorization} from './blossomAuth';
import {encodeBase64UrlNoPad, signedEventToJson} from './encoding';
import {NIP98_AUTH_KIND, buildNip98Authorization} from './nip98Auth';

const PUBKEY = 'a'.repeat(64);
const SIG = 'b'.repeat(128);
const EVENT_ID = 'c'.repeat(64);

function fakeSigner(capture: {event?: SignableEvent}): ISigner {
  return {
    async getPublicKey() {
      return ok(PUBKEY);
    },
    async signEvent(event: SignableEvent) {
      capture.event = event;
      const signed: SignedEvent = {
        id: EVENT_ID,
        pubkey: PUBKEY,
        created_at: event.created_at,
        kind: event.kind,
        tags: event.tags,
        content: event.content,
        sig: SIG,
      };
      return ok(signed);
    },
  };
}

describe('blossomAuth', () => {
  it('builds kind 24242 with required tags', async () => {
    const capture: {event?: SignableEvent} = {};
    const sha = 'd'.repeat(64);
    const result = await buildBlossomUploadAuthorization(fakeSigner(capture), {
      sha256: sha,
      createdAt: 1_700_000_000,
      ttlSeconds: 60,
      serverHost: 'blossom.primal.net',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(capture.event?.kind).toBe(BLOSSOM_AUTH_KIND);
    expect(capture.event?.content).toBe('Upload Blob');
    const tags = capture.event?.tags ?? [];
    expect(tags).toEqual(
      expect.arrayContaining([
        ['t', 'upload'],
        ['expiration', '1700000060'],
        ['x', sha],
        ['server', 'blossom.primal.net'],
      ]),
    );
    expect(result.value.authorization.startsWith('Nostr ')).toBe(true);
    const encoded = result.value.authorization.slice('Nostr '.length);
    expect(encoded).toBe(encodeBase64UrlNoPad(signedEventToJson(result.value.event)));
    expect(encoded.includes('+')).toBe(false);
    expect(encoded.includes('/')).toBe(false);
    expect(encoded.includes('=')).toBe(false);
  });
});

describe('nip98Auth', () => {
  it('builds kind 27235 with u and method tags', async () => {
    const capture: {event?: SignableEvent} = {};
    const result = await buildNip98Authorization(fakeSigner(capture), {
      url: 'https://media.example/upload',
      method: 'POST',
      payloadSha256: 'e'.repeat(64),
      createdAt: 1_700_000_000,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(capture.event?.kind).toBe(NIP98_AUTH_KIND);
    const tags = capture.event?.tags ?? [];
    expect(tags).toEqual(
      expect.arrayContaining([
        ['u', 'https://media.example/upload'],
        ['method', 'POST'],
        ['payload', 'e'.repeat(64)],
      ]),
    );
    expect(result.value.authorization.startsWith('Nostr ')).toBe(true);
    const encoded = result.value.authorization.slice('Nostr '.length);
    expect(encoded.length).toBeGreaterThan(0);
  });
});
