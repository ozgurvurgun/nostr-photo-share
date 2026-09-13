import {ok} from '../../../core/result/Result';
import type {ISigner, SignedEvent} from '../../auth/application/ports/ISigner';
import {ImageAttachment} from '../../media-upload/domain/ImageAttachment';
import {STORY_KIND, STORY_TTL_SECONDS} from '../domain/StoryKind';
import {InMemoryStoryCache} from '../infrastructure/InMemoryStoryCache';
import {PublishStoryUseCase} from './PublishStoryUseCase';
import type {IStoryRepository} from './ports/IStoryRepository';

const PUBKEY = 'f'.repeat(64);
const ID = '1'.repeat(64);
const SIG = '2'.repeat(128);

describe('PublishStoryUseCase', () => {
  it('signs, publishes, and caches a kind 20 story with NIP-40 expiration', async () => {
    const attachment = ImageAttachment.create({
      url: 'https://cdn.example/up.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 2048,
      width: 800,
      height: 600,
      sha256: '3'.repeat(64),
    });
    expect(attachment.ok).toBe(true);
    if (!attachment.ok) {
      return;
    }

    let publishedKind: number | null = null;
    let publishedTags: readonly (readonly string[])[] = [];
    const repository: IStoryRepository = {
      fetchActive: async () => ok([]),
      publish: async event => {
        publishedKind = event.kind;
        publishedTags = event.tags;
        return ok(undefined);
      },
    };

    const signer: ISigner = {
      getPublicKey: async () => ok(PUBKEY),
      signEvent: async event =>
        ok({
          id: ID,
          pubkey: PUBKEY,
          created_at: event.created_at,
          kind: event.kind,
          tags: event.tags,
          content: event.content,
          sig: SIG,
        } satisfies SignedEvent),
    };

    const cache = new InMemoryStoryCache();
    const useCase = new PublishStoryUseCase(repository, cache, () => signer);
    const createdAt = Math.floor(Date.now() / 1000);
    const result = await useCase.execute({
      attachment: attachment.value,
      caption: 'Evening light',
      createdAt,
    });

    expect(result.ok).toBe(true);
    expect(publishedKind).toBe(STORY_KIND);
    expect(publishedKind).toBe(20);
    expect(publishedTags.some(tag => tag[0] === 'expiration')).toBe(true);
    expect(publishedTags.some(tag => tag[0] === 'title')).toBe(true);
    expect(publishedTags.some(tag => tag[0] === 'imeta')).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.expiresAt).toBe(createdAt + STORY_TTL_SECONDS);
    expect(result.value.caption).toBe('Evening light');
    expect(cache.get()?.stories).toHaveLength(1);
  });
});
