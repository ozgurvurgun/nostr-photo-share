import {Kind10002Mapper} from './Kind10002Mapper';
import {RELAY_LIST_KIND} from '../domain/kinds';
import {buildKind10002UnsignedEvent} from '../application/kind10002Draft';

const OWNER = 'a'.repeat(64);
const ID = 'd'.repeat(64);
const SIG = 'e'.repeat(128);

describe('Kind10002Mapper', () => {
  it('round-trips read / write / both markers', () => {
    const preferences = [
      {url: 'wss://both.example', read: true, write: true},
      {url: 'wss://read.example', read: true, write: false},
      {url: 'wss://write.example', read: false, write: true},
    ];
    const draft = buildKind10002UnsignedEvent({preferences, createdAt: 42});
    expect(draft.tags).toEqual(Kind10002Mapper.toTags(preferences));

    const mapped = Kind10002Mapper.fromEvent({
      id: ID,
      pubkey: OWNER,
      created_at: 42,
      kind: RELAY_LIST_KIND,
      tags: draft.tags,
      content: '',
      sig: SIG,
    });

    expect(mapped.ok).toBe(true);
    if (!mapped.ok) {
      return;
    }
    expect(mapped.value.preferences).toEqual(preferences);
    expect(mapped.value.eventId).toBe(ID);
    expect(mapped.value.createdAt).toBe(42);
  });

  it('merges separate read and write tags for the same URL into both', () => {
    const mapped = Kind10002Mapper.fromEvent({
      id: ID,
      pubkey: OWNER,
      created_at: 1,
      kind: RELAY_LIST_KIND,
      tags: [
        ['r', 'wss://relay.example', 'read'],
        ['r', 'WSS://Relay.Example/', 'write'],
      ],
      content: '',
      sig: SIG,
    });

    expect(mapped.ok).toBe(true);
    if (!mapped.ok) {
      return;
    }
    expect(mapped.value.preferences).toEqual([
      {url: 'wss://relay.example', read: true, write: true},
    ]);
  });
});
