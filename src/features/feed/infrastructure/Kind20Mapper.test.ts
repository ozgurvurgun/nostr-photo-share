import {Kind20Mapper} from './Kind20Mapper';
import {buildKind20UnsignedEvent} from '../application/kind20Draft';
import {PICTURE_EVENT_KIND} from '../domain/PictureKind';

const PUBKEY = 'a'.repeat(64);
const ID = 'b'.repeat(64);
const SIG = 'c'.repeat(128);
const HASH = 'd'.repeat(64);

describe('Kind20Mapper', () => {
  it('round-trips a single-image kind 20 event', () => {
    const draft = buildKind20UnsignedEvent({
      title: 'Costa Rica',
      caption: 'Coast',
      createdAt: 1_700_000_100,
      media: {
        url: 'https://cdn.example/i.jpg',
        mimeType: 'image/jpeg',
        width: 3024,
        height: 4032,
        alt: 'Coast photo',
        sha256: HASH,
        blurhash: 'eVF$^OI',
        fallbackUrls: ['https://fallback.example/i.jpg'],
      },
    });

    expect(draft.kind).toBe(PICTURE_EVENT_KIND);
    expect(draft.tags[0]).toEqual(['title', 'Costa Rica']);
    expect(draft.tags.some(tag => tag[0] === 'imeta')).toBe(true);

    const mapped = Kind20Mapper.fromEvent({
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
    expect(mapped.value.title).toBe('Costa Rica');
    expect(mapped.value.media.url).toBe('https://cdn.example/i.jpg');
    expect(mapped.value.media.width).toBe(3024);
    expect(mapped.value.media.height).toBe(4032);
    expect(mapped.value.media.sha256).toBe(HASH);
    expect(mapped.value.media.fallbackUrls).toEqual(['https://fallback.example/i.jpg']);
  });

  it('rejects events without imeta', () => {
    const result = Kind20Mapper.fromEvent({
      id: ID,
      pubkey: PUBKEY,
      created_at: 1,
      kind: PICTURE_EVENT_KIND,
      tags: [['title', 'No image']],
      content: '',
      sig: SIG,
    });
    expect(result.ok).toBe(false);
  });

  it('uses only the first valid imeta (V1 single image)', () => {
    const result = Kind20Mapper.fromEvent({
      id: ID,
      pubkey: PUBKEY,
      created_at: 1,
      kind: PICTURE_EVENT_KIND,
      tags: [
        ['title', 'Carousel'],
        [
          'imeta',
          'url https://cdn.example/first.jpg',
          'm image/png',
          'dim 100x100',
        ],
        [
          'imeta',
          'url https://cdn.example/second.jpg',
          'm image/jpeg',
          'dim 200x200',
        ],
      ],
      content: '',
      sig: SIG,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.media.url).toBe('https://cdn.example/first.jpg');
  });

  it('falls back to top-level m and jpg alias', () => {
    const result = Kind20Mapper.fromEvent({
      id: ID,
      pubkey: PUBKEY,
      created_at: 1,
      kind: PICTURE_EVENT_KIND,
      tags: [
        ['title', 'Alias'],
        ['m', 'image/jpg'],
        ['imeta', 'url https://cdn.example/a.jpg', 'dim 10x10'],
      ],
      content: '',
      sig: SIG,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.media.mimeType).toBe('image/jpeg');
  });

  it('rejects expiring kind 20 events (stories belong outside the feed)', () => {
    const result = Kind20Mapper.fromEvent({
      id: ID,
      pubkey: PUBKEY,
      created_at: 100,
      kind: PICTURE_EVENT_KIND,
      tags: [
        ['title', 'Story'],
        ['expiration', '200'],
        ['imeta', 'url https://cdn.example/a.jpg', 'm image/jpeg'],
      ],
      content: '',
      sig: SIG,
    });
    expect(result.ok).toBe(false);
  });
});
