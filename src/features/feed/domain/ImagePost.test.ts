import {ImagePost} from './ImagePost';

const PUBKEY = 'b'.repeat(64);
const ID = 'c'.repeat(64);

describe('ImagePost', () => {
  it('creates a valid single-image post', () => {
    const result = ImagePost.create({
      id: ID,
      authorPubkeyHex: PUBKEY,
      title: 'Sunset',
      caption: 'Nice view',
      createdAt: 1_700_000_000,
      media: {
        url: 'https://cdn.example/a.jpg',
        mimeType: 'image/jpeg',
        width: 640,
        height: 480,
        sha256: 'd'.repeat(64),
        fallbackUrls: [],
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.aspectRatio).toBeCloseTo(640 / 480);
    expect(result.value.title).toBe('Sunset');
  });

  it('rejects missing title', () => {
    const result = ImagePost.create({
      id: ID,
      authorPubkeyHex: PUBKEY,
      title: '  ',
      caption: '',
      createdAt: 1,
      media: {
        url: 'https://cdn.example/a.jpg',
        mimeType: 'image/png',
        fallbackUrls: [],
      },
    });
    expect(result.ok).toBe(false);
  });

  it('rejects non-http media urls', () => {
    const result = ImagePost.create({
      id: ID,
      authorPubkeyHex: PUBKEY,
      title: 'x',
      caption: '',
      createdAt: 1,
      media: {
        url: 'ftp://cdn.example/a.jpg',
        mimeType: 'image/jpeg',
        fallbackUrls: [],
      },
    });
    expect(result.ok).toBe(false);
  });
});
