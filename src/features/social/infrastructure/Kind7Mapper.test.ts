import {buildKind7LikeUnsignedEvent} from '../application/kind7Draft';
import {REACTION_KIND} from '../domain/kinds';
import {Kind7Mapper} from './Kind7Mapper';

const AUTHOR = 'a'.repeat(64);
const TARGET = 'b'.repeat(64);
const TARGET_AUTHOR = 'c'.repeat(64);
const ID = 'd'.repeat(64);
const SIG = 'e'.repeat(128);

describe('Kind7Mapper', () => {
  it('builds a like draft with e, p, and k tags', () => {
    const draft = buildKind7LikeUnsignedEvent({
      targetEventId: TARGET,
      targetAuthorPubkeyHex: TARGET_AUTHOR,
      targetKind: 20,
      createdAt: 50,
    });

    expect(draft.kind).toBe(REACTION_KIND);
    expect(draft.content).toBe('+');
    expect(draft.tags).toEqual([
      ['e', TARGET],
      ['p', TARGET_AUTHOR],
      ['k', '20'],
    ]);
  });

  it('parses a kind 7 like event', () => {
    const draft = buildKind7LikeUnsignedEvent({
      targetEventId: TARGET,
      targetAuthorPubkeyHex: TARGET_AUTHOR,
      targetKind: 20,
      createdAt: 50,
    });

    const mapped = Kind7Mapper.fromEvent({
      id: ID,
      pubkey: AUTHOR,
      created_at: draft.created_at,
      kind: draft.kind,
      tags: draft.tags,
      content: draft.content,
      sig: SIG,
    });

    expect(mapped.ok).toBe(true);
    if (!mapped.ok) {
      return;
    }
    expect(mapped.value.isLike).toBe(true);
    expect(mapped.value.targetEventId).toBe(TARGET);
    expect(mapped.value.targetKind).toBe(20);
  });

  it('uses the last e and p tags as the reaction target', () => {
    const mapped = Kind7Mapper.fromEvent({
      id: ID,
      pubkey: AUTHOR,
      created_at: 1,
      kind: REACTION_KIND,
      tags: [
        ['e', '1'.repeat(64)],
        ['p', '2'.repeat(64)],
        ['e', TARGET],
        ['p', TARGET_AUTHOR],
        ['k', '20'],
      ],
      content: '+',
      sig: SIG,
    });
    expect(mapped.ok).toBe(true);
    if (!mapped.ok) {
      return;
    }
    expect(mapped.value.targetEventId).toBe(TARGET);
    expect(mapped.value.targetAuthorPubkeyHex).toBe(TARGET_AUTHOR);
  });
});
