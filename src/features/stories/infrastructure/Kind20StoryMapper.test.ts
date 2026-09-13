import {Kind20StoryMapper} from './Kind20StoryMapper';
import {buildKind20StoryUnsignedEvent} from '../application/kind20StoryDraft';
import {STORY_KIND, STORY_TTL_SECONDS} from '../domain/StoryKind';

const PUBKEY = 'a'.repeat(64);
const ID = 'b'.repeat(64);
const SIG = 'c'.repeat(128);
const HASH = 'd'.repeat(64);

describe('Kind20StoryMapper', () => {
  it('round-trips a kind 20 story with expiration + imeta', () => {
    const createdAt = 1_700_000_100;
    const expiresAt = createdAt + STORY_TTL_SECONDS;
    const draft = buildKind20StoryUnsignedEvent({
      title: 'Coast',
      caption: 'Coast',
      createdAt,
      expiresAt,
      media: {
        url: 'https://cdn.example/i.jpg',
        mimeType: 'image/jpeg',
        width: 1080,
        height: 1920,
        alt: 'Coast photo',
        sha256: HASH,
      },
    });

    expect(draft.kind).toBe(STORY_KIND);
    expect(draft.kind).toBe(20);
    expect(draft.tags.some(tag => tag[0] === 'title' && tag[1] === 'Coast')).toBe(true);
    expect(draft.tags.some(tag => tag[0] === 'expiration' && tag[1] === String(expiresAt))).toBe(
      true,
    );
    expect(draft.tags.some(tag => tag[0] === 'imeta')).toBe(true);

    const mapped = Kind20StoryMapper.fromEvent({
      id: ID,
      pubkey: PUBKEY,
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
    expect(mapped.value.caption).toBe('Coast');
    expect(mapped.value.expiresAt).toBe(expiresAt);
    expect(mapped.value.media.url).toBe('https://cdn.example/i.jpg');
    expect(mapped.value.media.width).toBe(1080);
    expect(mapped.value.media.height).toBe(1920);
    expect(mapped.value.media.sha256).toBe(HASH);
  });

  it('rejects durable kind 20 without expiration', () => {
    const result = Kind20StoryMapper.fromEvent({
      id: ID,
      pubkey: PUBKEY,
      created_at: 100,
      kind: STORY_KIND,
      tags: [
        ['title', 'Post'],
        ['imeta', 'url https://cdn.example/a.jpg', 'm image/png'],
      ],
      content: '',
      sig: SIG,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects non-numeric expiration', () => {
    const result = Kind20StoryMapper.fromEvent({
      id: ID,
      pubkey: PUBKEY,
      created_at: 100,
      kind: STORY_KIND,
      tags: [
        ['title', 'Story'],
        ['expiration', 'soon'],
        ['imeta', 'url https://cdn.example/a.jpg', 'm image/jpeg'],
      ],
      content: '',
      sig: SIG,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects expiresAt <= createdAt', () => {
    const result = Kind20StoryMapper.fromEvent({
      id: ID,
      pubkey: PUBKEY,
      created_at: 100,
      kind: STORY_KIND,
      tags: [
        ['title', 'Story'],
        ['expiration', '100'],
        ['imeta', 'url https://cdn.example/a.jpg', 'm image/jpeg'],
      ],
      content: '',
      sig: SIG,
    });
    expect(result.ok).toBe(false);
  });
});
