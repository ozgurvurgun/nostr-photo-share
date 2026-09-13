import {isStoryExpired, Story} from './Story';
import {STORY_TTL_SECONDS} from './StoryKind';

const PUBKEY = 'b'.repeat(64);
const ID = 'c'.repeat(64);
const HASH = 'd'.repeat(64);

function validProps(overrides: Partial<Parameters<typeof Story.create>[0]> = {}) {
  const createdAt = 1_700_000_000;
  return {
    id: ID,
    authorPubkeyHex: PUBKEY,
    caption: 'Hello',
    createdAt,
    expiresAt: createdAt + STORY_TTL_SECONDS,
    media: {
      url: 'https://cdn.example/story.jpg',
      mimeType: 'image/jpeg',
      width: 1080,
      height: 1920,
      sha256: HASH,
      alt: 'Story photo',
    },
    ...overrides,
  };
}

describe('Story', () => {
  it('creates a valid story with 24h default TTL window', () => {
    const result = Story.create(validProps());
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.expiresAt - result.value.createdAt).toBe(STORY_TTL_SECONDS);
    expect(result.value.media.mimeType).toBe('image/jpeg');
  });

  it('marks story expired when expiresAt <= now (hidden client-side)', () => {
    const created = Story.create(validProps({createdAt: 100, expiresAt: 200}));
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    expect(isStoryExpired(created.value, 200)).toBe(true);
    expect(isStoryExpired(created.value, 201)).toBe(true);
  });

  it('keeps future stories visible before expiration', () => {
    const created = Story.create(validProps({createdAt: 100, expiresAt: 200}));
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    expect(isStoryExpired(created.value, 199)).toBe(false);
    expect(isStoryExpired(created.value, 100)).toBe(false);
  });

  it('rejects missing / non-numeric / non-positive-duration expiration', () => {
    expect(Story.create(validProps({expiresAt: Number.NaN})).ok).toBe(false);
    expect(Story.create(validProps({expiresAt: Number.POSITIVE_INFINITY})).ok).toBe(false);
    expect(Story.create(validProps({createdAt: 100, expiresAt: 100})).ok).toBe(false);
    expect(Story.create(validProps({createdAt: 100, expiresAt: 99})).ok).toBe(false);
  });

  it('rejects unsupported media MIME types', () => {
    const result = Story.create(
      validProps({
        media: {
          url: 'https://cdn.example/clip.mp4',
          mimeType: 'video/mp4',
        },
      }),
    );
    expect(result.ok).toBe(false);
  });
});
