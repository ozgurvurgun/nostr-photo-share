import {SignerUnavailableError} from '../../../core/errors/errors';
import {err, ok, type Result} from '../../../core/result/Result';
import type {ISigner} from '../../auth/application/ports/ISigner';
import type {ImageAttachment} from '../../media-upload/domain/ImageAttachment';
import {
  ImagePost,
  MAX_IMAGE_POST_CAPTION_LENGTH,
  MAX_IMAGE_POST_TITLE_LENGTH,
  createMedia,
} from '../domain/ImagePost';
import {FeedPublishError, InvalidImagePostError} from '../domain/errors';
import type {IFeedCache} from './ports/IFeedCache';
import type {IFeedRepository} from './ports/IFeedRepository';
import {buildKind20UnsignedEvent} from './kind20Draft';

export type PublishImagePostInput = {
  readonly title: string;
  readonly caption: string;
  readonly attachment: ImageAttachment;
};

export type PublishImagePostError =
  | SignerUnavailableError
  | InvalidImagePostError
  | FeedPublishError;

/**
 * Signs and publishes a NIP-68 kind:20 picture event for a successfully uploaded image.
 */
export class PublishImagePostUseCase {
  constructor(
    private readonly repository: IFeedRepository,
    private readonly cache: IFeedCache,
    private readonly getSigner: () => ISigner | null,
  ) {}

  async execute(
    input: PublishImagePostInput,
  ): Promise<Result<ImagePost, PublishImagePostError>> {
    const signer = this.getSigner();
    if (signer === null) {
      return err(new SignerUnavailableError('No signer available to publish image post'));
    }

    const title = input.title.trim();
    if (title.length === 0) {
      return err(new InvalidImagePostError('Title is required'));
    }
    if (title.length > MAX_IMAGE_POST_TITLE_LENGTH) {
      return err(
        new InvalidImagePostError(
          `Title must be at most ${MAX_IMAGE_POST_TITLE_LENGTH} characters`,
        ),
      );
    }

    const caption = input.caption.trim();
    if (caption.length > MAX_IMAGE_POST_CAPTION_LENGTH) {
      return err(
        new InvalidImagePostError(
          `Caption must be at most ${MAX_IMAGE_POST_CAPTION_LENGTH} characters`,
        ),
      );
    }

    const mediaResult = createMedia({
      url: input.attachment.url,
      mimeType: input.attachment.mimeType,
      width: input.attachment.width,
      height: input.attachment.height,
      sha256: input.attachment.sha256,
      alt: input.attachment.alt ?? title,
    });
    if (!mediaResult.ok) {
      return mediaResult;
    }

    const draft = buildKind20UnsignedEvent({
      title,
      caption,
      media: mediaResult.value,
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

    const postResult = ImagePost.create({
      id: signed.value.id,
      authorPubkeyHex: signed.value.pubkey,
      title,
      caption,
      createdAt: signed.value.created_at,
      media: mediaResult.value,
    });
    if (!postResult.ok) {
      return err(new FeedPublishError('Published event could not be mapped to ImagePost'));
    }

    this.cache.merge([postResult.value]);
    return ok(postResult.value);
  }
}
