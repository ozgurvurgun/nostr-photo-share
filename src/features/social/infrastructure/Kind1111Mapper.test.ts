import {buildKind1111UnsignedEvent} from '../application/kind1111Draft';
import {COMMENT_KIND} from '../domain/kinds';
import {Kind1111Mapper} from './Kind1111Mapper';

const AUTHOR = 'a'.repeat(64);
const POST_ID = 'b'.repeat(64);
const POST_AUTHOR = 'c'.repeat(64);
const COMMENT_ID = 'd'.repeat(64);
const COMMENT_AUTHOR = 'e'.repeat(64);
const ID = '1'.repeat(64);
const SIG = '2'.repeat(128);

describe('Kind1111Mapper', () => {
  it('builds a top-level comment with matching root and parent tags', () => {
    const draft = buildKind1111UnsignedEvent({
      content: 'Nice shot',
      rootEventId: POST_ID,
      rootAuthorPubkeyHex: POST_AUTHOR,
      rootKind: 20,
      parentEventId: POST_ID,
      parentAuthorPubkeyHex: POST_AUTHOR,
      parentKind: 20,
      createdAt: 10,
    });

    expect(draft.kind).toBe(COMMENT_KIND);
    expect(draft.tags).toEqual([
      ['E', POST_ID, '', POST_AUTHOR],
      ['K', '20'],
      ['P', POST_AUTHOR],
      ['e', POST_ID, '', POST_AUTHOR],
      ['k', '20'],
      ['p', POST_AUTHOR],
    ]);
  });

  it('builds a reply with root on picture and parent on comment', () => {
    const draft = buildKind1111UnsignedEvent({
      content: 'Agree',
      rootEventId: POST_ID,
      rootAuthorPubkeyHex: POST_AUTHOR,
      rootKind: 20,
      parentEventId: COMMENT_ID,
      parentAuthorPubkeyHex: COMMENT_AUTHOR,
      parentKind: 1111,
      createdAt: 11,
    });

    expect(draft.tags).toEqual([
      ['E', POST_ID, '', POST_AUTHOR],
      ['K', '20'],
      ['P', POST_AUTHOR],
      ['e', COMMENT_ID, '', COMMENT_AUTHOR],
      ['k', '1111'],
      ['p', COMMENT_AUTHOR],
    ]);
  });

  it('parses a top-level comment event', () => {
    const draft = buildKind1111UnsignedEvent({
      content: 'Hello',
      rootEventId: POST_ID,
      rootAuthorPubkeyHex: POST_AUTHOR,
      rootKind: 20,
      parentEventId: POST_ID,
      parentAuthorPubkeyHex: POST_AUTHOR,
      parentKind: 20,
      createdAt: 10,
    });

    const mapped = Kind1111Mapper.fromEvent({
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
    expect(mapped.value.content).toBe('Hello');
    expect(mapped.value.isTopLevel).toBe(true);
    expect(mapped.value.rootKind).toBe(20);
  });
});
