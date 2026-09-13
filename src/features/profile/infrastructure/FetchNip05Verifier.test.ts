import {Nip05Identifier} from '../domain/Nip05Identifier';
import {FetchNip05Verifier, type FetchLike} from './FetchNip05Verifier';

const PUBKEY = 'aa'.repeat(32);

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {'Content-Type': 'application/json'},
    ...init,
  });
}

describe('FetchNip05Verifier', () => {
  it('verifies matching pubkey', async () => {
    const fetchFn: FetchLike = jest.fn(async () =>
      jsonResponse({names: {still: PUBKEY.toUpperCase()}}),
    );
    const verifier = new FetchNip05Verifier(fetchFn);
    const id = Nip05Identifier.parse('still@example.com');
    expect(id.ok).toBe(true);
    if (!id.ok) {
      return;
    }

    const result = await verifier.verify(id.value, PUBKEY);
    expect(result).toEqual({status: 'verified'});
    expect(fetchFn).toHaveBeenCalledWith(
      'https://example.com/.well-known/nostr.json?name=still',
      expect.objectContaining({redirect: 'manual'}),
    );
  });

  it('fails on pubkey mismatch', async () => {
    const fetchFn: FetchLike = jest.fn(async () =>
      jsonResponse({names: {still: 'bb'.repeat(32)}}),
    );
    const verifier = new FetchNip05Verifier(fetchFn);
    const id = Nip05Identifier.parse('still@example.com');
    if (!id.ok) {
      throw new Error('parse');
    }
    const result = await verifier.verify(id.value, PUBKEY);
    expect(result).toEqual({status: 'failed', reason: 'mismatch'});
  });

  it('rejects HTTP redirects', async () => {
    const fetchFn: FetchLike = jest.fn(async () =>
      new Response(null, {status: 302, headers: {Location: 'https://evil.example/'}}),
    );
    const verifier = new FetchNip05Verifier(fetchFn);
    const id = Nip05Identifier.parse('still@example.com');
    if (!id.ok) {
      throw new Error('parse');
    }
    const result = await verifier.verify(id.value, PUBKEY);
    expect(result).toEqual({status: 'failed', reason: 'redirect'});
  });

  it('fails on network errors', async () => {
    const fetchFn: FetchLike = jest.fn(async () => {
      throw new Error('offline');
    });
    const verifier = new FetchNip05Verifier(fetchFn);
    const id = Nip05Identifier.parse('still@example.com');
    if (!id.ok) {
      throw new Error('parse');
    }
    const result = await verifier.verify(id.value, PUBKEY);
    expect(result).toEqual({status: 'failed', reason: 'network'});
  });
});
