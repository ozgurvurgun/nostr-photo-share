import {err, ok, type Result} from '../../../core/result/Result';
import {InvalidStoryError} from './errors';
import {
  isStoryImageMimeType,
  normalizeStoryImageMimeType,
  STORY_TTL_SECONDS,
} from './StoryKind';

/** Single image attachment on a story slide (V1: one image per story). */
export type StoryMedia = {
  readonly url: string;
  readonly mimeType: string;
  readonly width?: number;
  readonly height?: number;
  readonly sha256?: string;
  readonly alt?: string;
};

export type StoryProps = {
  readonly id: string;
  readonly authorPubkeyHex: string;
  readonly caption: string;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly media: StoryMedia;
};

/**
 * Domain model for a story slide: NIP-68 kind:20 picture + NIP-40 expiration.
 * Clients must hide stories where expiresAt <= now even if relays still return them.
 */
export class Story {
  private constructor(
    readonly id: string,
    readonly authorPubkeyHex: string,
    readonly caption: string,
    readonly createdAt: number,
    readonly expiresAt: number,
    readonly media: StoryMedia,
  ) {}

  static create(props: StoryProps): Result<Story, InvalidStoryError> {
    const id = props.id.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(id)) {
      return err(new InvalidStoryError('Story id must be 64 hex characters'));
    }

    const authorPubkeyHex = props.authorPubkeyHex.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(authorPubkeyHex)) {
      return err(new InvalidStoryError('Author pubkey must be 64 hex characters'));
    }

    if (!Number.isFinite(props.createdAt) || props.createdAt <= 0) {
      return err(new InvalidStoryError('createdAt must be a positive unix timestamp'));
    }

    const expirationResult = validateExpiration(props.createdAt, props.expiresAt);
    if (!expirationResult.ok) {
      return expirationResult;
    }

    const mediaResult = createStoryMedia(props.media);
    if (!mediaResult.ok) {
      return mediaResult;
    }

    return ok(
      new Story(
        id,
        authorPubkeyHex,
        props.caption.trim(),
        Math.floor(props.createdAt),
        Math.floor(props.expiresAt),
        mediaResult.value,
      ),
    );
  }
}

/**
 * True when the story must be hidden client-side.
 * Never rely on relay-side deletion (NIP-40 is advisory).
 */
export function isStoryExpired(story: Story, nowSec: number): boolean {
  return story.expiresAt <= nowSec;
}

/** Default expiresAt for a new story: createdAt + 24h. */
export function defaultStoryExpiresAt(createdAt: number): number {
  return Math.floor(createdAt) + STORY_TTL_SECONDS;
}

export function validateExpiration(
  createdAt: number,
  expiresAt: number,
): Result<number, InvalidStoryError> {
  if (!Number.isFinite(expiresAt)) {
    return err(new InvalidStoryError('expiresAt must be a numeric unix timestamp'));
  }
  if (expiresAt <= createdAt) {
    return err(new InvalidStoryError('expiresAt must be greater than createdAt'));
  }
  return ok(Math.floor(expiresAt));
}

export function createStoryMedia(media: StoryMedia): Result<StoryMedia, InvalidStoryError> {
  const url = media.url.trim();
  if (url.length === 0) {
    return err(new InvalidStoryError('Image URL is required'));
  }
  if (!/^https?:\/\//i.test(url)) {
    return err(new InvalidStoryError('Image URL must be http(s)'));
  }

  const mimeType = normalizeStoryImageMimeType(media.mimeType);
  if (!isStoryImageMimeType(mimeType)) {
    return err(new InvalidStoryError(`Unsupported image MIME type: ${media.mimeType}`));
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
      return err(new InvalidStoryError('Image dimensions must be positive when provided'));
    }
  }

  let sha256: string | undefined;
  if (media.sha256 !== undefined) {
    const normalized = media.sha256.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(normalized)) {
      return err(new InvalidStoryError('sha256 must be 64 lowercase hex characters'));
    }
    sha256 = normalized;
  }

  const alt = media.alt?.trim();

  return ok({
    url,
    mimeType,
    width,
    height,
    sha256,
    alt: alt && alt.length > 0 ? alt : undefined,
  });
}

/** Max caption length for create-story UI. */
export const MAX_STORY_CAPTION_LENGTH = 500;
