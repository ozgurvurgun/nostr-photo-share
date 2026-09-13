import {err, ok} from '../../../core/result/Result';
import {FeedFetchError} from '../domain/errors';
import {ImagePost} from '../domain/ImagePost';
import {GetFeedPageUseCase} from './GetFeedPageUseCase';
import type {IFeedCache} from './ports/IFeedCache';
import type {FeedPage, IFeedRepository} from './ports/IFeedRepository';
import {InMemoryFeedCache} from '../infrastructure/InMemoryFeedCache';

const PUBKEY = 'e'.repeat(64);

function post(idChar: string, createdAt: number): ImagePost {
  const created = ImagePost.create({
    id: idChar.repeat(64),
    authorPubkeyHex: PUBKEY,
    title: `Post ${idChar}`,
    caption: '',
    createdAt,
    media: {
      url: `https://cdn.example/${idChar}.jpg`,
      mimeType: 'image/jpeg',
      width: 10,
      height: 10,
      fallbackUrls: [],
    },
  });
  if (!created.ok) {
    throw created.error;
  }
  return created.value;
}

describe('GetFeedPageUseCase', () => {
  it('merges successful pages into cache', async () => {
    const cache = new InMemoryFeedCache();
    const repository: IFeedRepository = {
      fetchPage: async (): Promise<ReturnType<typeof ok<FeedPage>>> =>
        ok({
          posts: [post('1', 100), post('2', 90)],
          nextUntil: 89,
        }),
      publish: async () => ok(undefined),
    };

    const useCase = new GetFeedPageUseCase(repository, cache);
    const result = await useCase.execute({limit: 20});
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.fromCache).toBe(false);
    expect(result.value.posts).toHaveLength(2);
    expect(cache.get()?.posts).toHaveLength(2);
  });

  it('returns cached first page when fetch fails', async () => {
    const cache: IFeedCache = new InMemoryFeedCache();
    cache.merge([post('a', 50)]);

    const repository: IFeedRepository = {
      fetchPage: async () => err(new FeedFetchError('offline')),
      publish: async () => ok(undefined),
    };

    const useCase = new GetFeedPageUseCase(repository, cache);
    const result = await useCase.execute({limit: 20});
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.fromCache).toBe(true);
    expect(result.value.posts[0]?.id).toBe('a'.repeat(64));
  });
});
