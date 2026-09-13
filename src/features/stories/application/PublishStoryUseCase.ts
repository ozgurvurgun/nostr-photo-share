import {SignerUnavailableError} from '../../../core/errors/errors';
import {err, ok, type Result} from '../../../core/result/Result';
import type {ISigner} from '../../auth/application/ports/ISigner';
import type {ImageAttachment} from '../../media-upload/domain/ImageAttachment';
import {
  createStoryMedia,
  defaultStoryExpiresAt,
  MAX_STORY_CAPTION_LENGTH,
  Story,
} from '../domain/Story';
import {InvalidStoryError, StoryPublishError} from '../domain/errors';
import {
  buildKind20StoryUnsignedEvent,
  storyTitleFromCaption,
} from './kind20StoryDraft';
import type {IStoryCache} from './ports/IStoryCache';
import type {IStoryRepository} from './ports/IStoryRepository';

export type PublishStoryInput = {
  readonly attachment: ImageAttachment;
  readonly caption?: string;
  /** Override created_at (unix seconds); defaults to now. */
  readonly createdAt?: number;
};

export type PublishStoryError =
  | SignerUnavailableError
  | InvalidStoryError
  | StoryPublishError;

/**
 * Signs and publishes a NIP-68 kind:20 picture with NIP-40 expiration (24h TTL).
 */
export class PublishStoryUseCase {
  constructor(
    private readonly repository: IStoryRepository,
    private readonly cache: IStoryCache,
    private readonly getSigner: () => ISigner | null,
  ) {}

  async execute(input: PublishStoryInput): Promise<Result<Story, PublishStoryError>> {
    const signer = this.getSigner();
    if (signer === null) {
      return err(new SignerUnavailableError('No signer available to publish story'));
    }

    const caption = (input.caption ?? '').trim();
    if (caption.length > MAX_STORY_CAPTION_LENGTH) {
      return err(
        new InvalidStoryError(
          `Caption must be at most ${MAX_STORY_CAPTION_LENGTH} characters`,
        ),
      );
    }

    const mediaResult = createStoryMedia({
      url: input.attachment.url,
      mimeType: input.attachment.mimeType,
      width: input.attachment.width,
      height: input.attachment.height,
      sha256: input.attachment.sha256,
      alt: input.attachment.alt,
    });
    if (!mediaResult.ok) {
      return mediaResult;
    }

    const createdAt = input.createdAt ?? Math.floor(Date.now() / 1000);
    const expiresAt = defaultStoryExpiresAt(createdAt);

    const draft = buildKind20StoryUnsignedEvent({
      title: storyTitleFromCaption(caption),
      caption,
      media: mediaResult.value,
      createdAt,
      expiresAt,
    });

    const signed = await signer.signEvent(draft);
    if (!signed.ok) {
      return signed;
    }

    const publishResult = await this.repository.publish({
      id: signed.value.id,
      pubkey: signed.value.pubkey,
      created_at: signed.value.created_at,
      kind: signed.value.kind,
      tags: signed.value.tags,
      content: signed.value.content,
      sig: signed.value.sig,
    });
    if (!publishResult.ok) {
      return publishResult;
    }

    const storyResult = Story.create({
      id: signed.value.id,
      authorPubkeyHex: signed.value.pubkey,
      caption,
      createdAt: signed.value.created_at,
      expiresAt,
      media: mediaResult.value,
    });
    if (!storyResult.ok) {
      return err(new StoryPublishError('Published event could not be mapped to Story'));
    }

    this.cache.merge([storyResult.value]);
    return ok(storyResult.value);
  }
}
