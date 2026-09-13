import {InMemoryNostrToolsSigner} from '../crypto/InMemoryNostrToolsSigner';
import {EventValidator} from './EventValidator';

async function validEvent() {
  const signer = InMemoryNostrToolsSigner.generate();
  const signed = await signer.signEvent({
    created_at: 1_700_000_123,
    kind: 1,
    tags: [['client', 'still']],
    content: 'hello',
  });
  if (!signed.ok) {
    throw new Error('expected a signed event');
  }
  return signed.value;
}

describe('EventValidator', () => {
  const validator = new EventValidator();

  it('accepts a nostr-tools signed event', async () => {
    const event = await validEvent();
    const result = validator.validate(event);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(event.id);
      expect(result.value.content).toBe('hello');
    }
  });

  it('rejects malformed structure before crypto', () => {
    const result = validator.validate({
      id: 'not-hex',
      pubkey: 'aa'.repeat(32),
      created_at: 1,
      kind: 1,
      tags: [],
      content: '',
      sig: 'bb'.repeat(64),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('EVENT_VALIDATION');
    }
  });

  it('rejects an event whose id does not match getEventHash', async () => {
    const event = await validEvent();
    const result = validator.validate({
      ...event,
      id: 'ab'.repeat(32),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('EVENT_VALIDATION');
      expect(result.error.message).toMatch(/id/i);
    }
  });

  it('rejects an event with a tampered signature', async () => {
    const event = await validEvent();
    const tamperedSig = event.sig.endsWith('a') ? `${event.sig.slice(0, -1)}b` : `${event.sig.slice(0, -1)}a`;
    const result = validator.validate({
      ...event,
      sig: tamperedSig,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('SIGNATURE_VERIFICATION');
    }
  });

  it('rejects out-of-range kinds and non-string tags', () => {
    const kind = validator.validate({
      id: 'aa'.repeat(32),
      pubkey: 'bb'.repeat(32),
      created_at: 1,
      kind: 70_000,
      tags: [],
      content: '',
      sig: 'cc'.repeat(64),
    });
    const tags = validator.validate({
      id: 'aa'.repeat(32),
      pubkey: 'bb'.repeat(32),
      created_at: 1,
      kind: 1,
      tags: [[1, 'x']],
      content: '',
      sig: 'cc'.repeat(64),
    });

    expect(kind.ok).toBe(false);
    expect(tags.ok).toBe(false);
  });
});
