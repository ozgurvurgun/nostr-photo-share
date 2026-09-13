import {Kind3Mapper} from './Kind3Mapper';
import {FOLLOW_LIST_KIND} from '../domain/kinds';
import {buildKind3UnsignedEvent} from '../application/kind3Draft';

const OWNER = 'a'.repeat(64);
const PUBKEY_B = 'b'.repeat(64);
const PUBKEY_C = 'c'.repeat(64);
const ID = 'd'.repeat(64);
const SIG = 'e'.repeat(128);

describe('Kind3Mapper', () => {
  it('parses a kind 3 contact list', () => {
    const mapped = Kind3Mapper.fromEvent({
      id: ID,
      pubkey: OWNER,
      created_at: 100,
      kind: FOLLOW_LIST_KIND,
      tags: [
        ['p', PUBKEY_B, 'wss://relay.example'],
        ['p', PUBKEY_C, '', 'alice'],
      ],
      content: '',
      sig: SIG,
    });

    expect(mapped.ok).toBe(true);
    if (!mapped.ok) {
      return;
    }
    expect(mapped.value.contacts).toHaveLength(2);
    expect(mapped.value.contacts[0]?.pubkeyHex).toBe(PUBKEY_B);
    expect(mapped.value.contacts[0]?.relayUrl).toBe('wss://relay.example');
    expect(mapped.value.contacts[1]?.petname).toBe('alice');
  });

  it('appends follows at the end and removes without reordering', () => {
    const initial = [
      {pubkeyHex: PUBKEY_B},
      {pubkeyHex: PUBKEY_C},
    ];
    const withFollow = Kind3Mapper.withFollow(initial, {pubkeyHex: 'f'.repeat(64)});
    expect(withFollow.map(c => c.pubkeyHex)).toEqual([
      PUBKEY_B,
      PUBKEY_C,
      'f'.repeat(64),
    ]);

    const without = Kind3Mapper.withoutFollow(withFollow, PUBKEY_B);
    expect(without.map(c => c.pubkeyHex)).toEqual([PUBKEY_C, 'f'.repeat(64)]);
  });

  it('builds draft tags matching mapper toTags', () => {
    const contacts = [
      {pubkeyHex: PUBKEY_B, relayUrl: 'wss://r'},
      {pubkeyHex: PUBKEY_C, petname: 'bob'},
    ];
    const draft = buildKind3UnsignedEvent({contacts, createdAt: 1});
    expect(draft.kind).toBe(FOLLOW_LIST_KIND);
    expect(draft.tags).toEqual(Kind3Mapper.toTags(contacts));
  });
});
