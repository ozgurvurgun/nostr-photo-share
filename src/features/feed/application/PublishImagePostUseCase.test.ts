import {ok} from '../../../core/result/Result';
import type {ISigner, SignedEvent} from '../../auth/application/ports/ISigner';
import {ImageAttachment} from '../../media-upload/domain/ImageAttachment';
import {PublishImagePostUseCase} from './PublishImagePostUseCase';
import {InMemoryFeedCache} from '../infrastructure/InMemoryFeedCache';
import type {IFeedRepository} from './ports/IFeedRepository';
import {PICTURE_EVENT_KIND} from '../domain/PictureKind';

const PUBKEY = 'f'.repeat(64);
const ID = '1'.repeat(64);
const SIG = '2'.repeat(128);

describe('PublishImagePostUseCase', () => {
  it('signs, publishes, and caches a kind 20 post', async () => {
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
    const repository: IFeedRepository = {
      fetchPage: async () => ok({posts: [], nextUntil: null}),
      publish: async event => {
        publishedKind = event.kind;
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

    const cache = new InMemoryFeedCache();
    const useCase = new PublishImagePostUseCase(repository, cache, () => signer);
    const result = await useCase.execute({
      title: 'Hello',
      caption: 'World',
      attachment: attachment.value,
    });

    expect(result.ok).toBe(true);
    expect(publishedKind).toBe(PICTURE_EVENT_KIND);
    if (!result.ok) {
      return;
    }
    expect(result.value.title).toBe('Hello');
    expect(cache.get()?.posts).toHaveLength(1);
  });
});
