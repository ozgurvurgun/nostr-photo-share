import {err, ok} from '../../../core/result/Result';
import {StoryFetchError} from '../domain/errors';
import {Story} from '../domain/Story';
import {STORY_TTL_SECONDS} from '../domain/StoryKind';
import {InMemoryStoryCache} from '../infrastructure/InMemoryStoryCache';
import {GetActiveStoriesUseCase} from './GetActiveStoriesUseCase';
import type {IStoryRepository} from './ports/IStoryRepository';

const AUTHOR_A = 'a'.repeat(64);
const AUTHOR_B = 'b'.repeat(64);

function story(
  idChar: string,
  author: string,
  createdAt: number,
  expiresAt: number,
): Story {
  const created = Story.create({
    id: idChar.repeat(64),
    authorPubkeyHex: author,
    caption: '',
    createdAt,
    expiresAt,
    media: {
      url: `https://cdn.example/${idChar}.jpg`,
      mimeType: 'image/jpeg',
      width: 10,
      height: 10,
    },
  });
  if (!created.ok) {
    throw created.error;
  }
  return created.value;
}

describe('GetActiveStoriesUseCase', () => {
  it('filters expired stories client-side and groups by author', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const activeA = story('1', AUTHOR_A, nowSec - 100, nowSec + STORY_TTL_SECONDS);
    const expired = story('2', AUTHOR_A, nowSec - 200, nowSec);
    const activeB = story('3', AUTHOR_B, nowSec - 50, nowSec + 100);

    const cache = new InMemoryStoryCache();
    const repository: IStoryRepository = {
      fetchActive: async () => ok([activeA, expired, activeB]),
      publish: async () => ok(undefined),
    };

    const useCase = new GetActiveStoriesUseCase(repository, cache);
    const result = await useCase.execute({limit: 50, nowSec});
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.stories.map(s => s.id)).toEqual([
      activeB.id,
      activeA.id,
    ]);
    expect(result.value.byAuthor).toHaveLength(2);
    expect(result.value.byAuthor[0]?.authorPubkeyHex).toBe(AUTHOR_B);
    expect(result.value.fromCache).toBe(false);
    expect(cache.get()?.stories).toHaveLength(2);
  });

  it('returns cached active stories when fetch fails', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const cachedStory = story('c', AUTHOR_A, nowSec - 100, nowSec + 100);
    const cache = new InMemoryStoryCache();
    cache.merge([cachedStory]);

    const repository: IStoryRepository = {
      fetchActive: async () => err(new StoryFetchError('offline')),
      publish: async () => ok(undefined),
    };

    const useCase = new GetActiveStoriesUseCase(repository, cache);
    const result = await useCase.execute({limit: 20, nowSec});
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.fromCache).toBe(true);
    expect(result.value.stories).toHaveLength(1);
  });
});
