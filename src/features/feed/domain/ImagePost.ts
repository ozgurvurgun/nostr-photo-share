import {err, ok, type Result} from '../../../core/result/Result';
import {InvalidImagePostError} from './errors';
import {isNip68ImageMimeType, normalizeNip68ImageMimeType} from './PictureKind';

/** Single image attachment on a picture post (V1: one image per post). */
export type ImagePostMedia = {
  readonly url: string;
  readonly mimeType: string;
  readonly width?: number;
  readonly height?: number;
  readonly sha256?: string;
  readonly alt?: string;
  readonly blurhash?: string;
  readonly fallbackUrls: readonly string[];
};

export type ImagePostProps = {
  readonly id: string;
  readonly authorPubkeyHex: string;
  readonly title: string;
  readonly caption: string;
  readonly createdAt: number;
  readonly media: ImagePostMedia;
};

/**
 * Domain model for a NIP-68 kind:20 picture post.
 * V1 displays a single image even if the event contains multiple imeta tags.
 */
export class ImagePost {
  private constructor(
    readonly id: string,
    readonly authorPubkeyHex: string,
    readonly title: string,
    readonly caption: string,
    readonly createdAt: number,
    readonly media: ImagePostMedia,
  ) {}

  get aspectRatio(): number | undefined {
    const {width, height} = this.media;
    if (
      width === undefined ||
      height === undefined ||
      width <= 0 ||
      height <= 0
    ) {
      return undefined;
    }
    return width / height;
  }

  static create(props: ImagePostProps): Result<ImagePost, InvalidImagePostError> {
    const id = props.id.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(id)) {
      return err(new InvalidImagePostError('Post id must be 64 hex characters'));
    }

    const authorPubkeyHex = props.authorPubkeyHex.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(authorPubkeyHex)) {
      return err(new InvalidImagePostError('Author pubkey must be 64 hex characters'));
    }

    const title = props.title.trim();
    if (title.length === 0) {
      return err(new InvalidImagePostError('Title is required'));
    }

    if (!Number.isFinite(props.createdAt) || props.createdAt <= 0) {
      return err(new InvalidImagePostError('createdAt must be a positive unix timestamp'));
    }

    const mediaResult = createMedia(props.media);
    if (!mediaResult.ok) {
      return mediaResult;
    }

    return ok(
      new ImagePost(
        id,
        authorPubkeyHex,
        title,
        props.caption.trim(),
        Math.floor(props.createdAt),
        mediaResult.value,
      ),
    );
  }
}

export type CreateImagePostDraftInput = {
  readonly title: string;
  readonly caption: string;
  readonly media: Omit<ImagePostMedia, 'fallbackUrls'> & {
    readonly fallbackUrls?: readonly string[];
  };
};

export function createMedia(
  media: Omit<ImagePostMedia, 'fallbackUrls'> & {
    readonly fallbackUrls?: readonly string[];
  },
): Result<ImagePostMedia, InvalidImagePostError> {
  const url = media.url.trim();
  if (url.length === 0) {
    return err(new InvalidImagePostError('Image URL is required'));
  }
  if (!/^https?:\/\//i.test(url)) {
    return err(new InvalidImagePostError('Image URL must be http(s)'));
  }

  const mimeType = normalizeNip68ImageMimeType(media.mimeType);
  if (!isNip68ImageMimeType(mimeType)) {
    return err(new InvalidImagePostError(`Unsupported image MIME type: ${media.mimeType}`));
  }

  const width = media.width;
  const height = media.height;
  if (width !== undefined || height !== undefined) {
    if (
      width === undefined ||
      height === undefined ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      return err(new InvalidImagePostError('Image dimensions must be positive when provided'));
    }
  }

  let sha256: string | undefined;
  if (media.sha256 !== undefined) {
    const normalized = media.sha256.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(normalized)) {
      return err(new InvalidImagePostError('sha256 must be 64 lowercase hex characters'));
    }
    sha256 = normalized;
  }

  const alt = media.alt?.trim();
  const blurhash = media.blurhash?.trim();
  const fallbackUrls = (media.fallbackUrls ?? [])
    .map(value => value.trim())
    .filter(value => value.length > 0 && /^https?:\/\//i.test(value));

  return ok({
    url,
    mimeType,
    width,
    height,
    sha256,
    alt: alt && alt.length > 0 ? alt : undefined,
    blurhash: blurhash && blurhash.length > 0 ? blurhash : undefined,
    fallbackUrls,
  });
}

/** Max title length for create-post UI (NIP-68 title is a short label). */
export const MAX_IMAGE_POST_TITLE_LENGTH = 120;

/** Max caption length for create-post UI. */
export const MAX_IMAGE_POST_CAPTION_LENGTH = 2000;
