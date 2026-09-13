import {Nip05Identifier} from './Nip05Identifier';

describe('Nip05Identifier', () => {
  it('parses local@domain and lowercases', () => {
    const parsed = Nip05Identifier.parse('Alice@Example.COM');
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.local).toBe('alice');
    expect(parsed.value.domain).toBe('example.com');
    expect(parsed.value.displayLabel()).toBe('alice@example.com');
    expect(parsed.value.wellKnownUrl()).toBe(
      'https://example.com/.well-known/nostr.json?name=alice',
    );
  });

  it('displays _@domain as bare domain', () => {
    const parsed = Nip05Identifier.parse('_@still.app');
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.displayLabel()).toBe('still.app');
  });

  it('rejects invalid local parts', () => {
    expect(Nip05Identifier.parse('Bad Name@example.com').ok).toBe(false);
    expect(Nip05Identifier.parse('@example.com').ok).toBe(false);
    expect(Nip05Identifier.parse('alice@').ok).toBe(false);
  });
});
