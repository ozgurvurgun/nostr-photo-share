import {InMemoryNostrToolsSigner} from './InMemoryNostrToolsSigner';
import {nostrToolsCryptoAdapter} from './nostrToolsCryptoAdapter';

describe('InMemoryNostrToolsSigner', () => {
  it('signs an event that nostr-tools can verify', async () => {
    const signer = InMemoryNostrToolsSigner.generate();
    const pubkey = await signer.getPublicKey();
    expect(pubkey.ok).toBe(true);
    if (!pubkey.ok) {
      return;
    }

    const signed = await signer.signEvent({
      created_at: 1_700_000_000,
      kind: 1,
      tags: [],
      content: 'still',
    });

    expect(signed.ok).toBe(true);
    if (!signed.ok) {
      return;
    }

    expect(signed.value.pubkey).toBe(pubkey.value);
    expect(nostrToolsCryptoAdapter.verifyEvent(signed.value)).toBe(true);
    expect(nostrToolsCryptoAdapter.getEventHash({
      pubkey: signed.value.pubkey,
      created_at: signed.value.created_at,
      kind: signed.value.kind,
      tags: signed.value.tags,
      content: signed.value.content,
    })).toBe(signed.value.id);
  });

  it('does not include the secret key in signing errors', async () => {
    const secretKey = new Uint8Array(0);
    const signer = InMemoryNostrToolsSigner.fromSecretKey(secretKey);
    const result = await signer.signEvent({
      created_at: 1,
      kind: 1,
      tags: [],
      content: 'still',
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.message).toBe('Failed to sign event');
    expect(result.error.message).not.toMatch(/[0-9a-f]{64}/);
  });
});
