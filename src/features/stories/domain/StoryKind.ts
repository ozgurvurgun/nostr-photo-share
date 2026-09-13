import {PICTURE_EVENT_KIND} from '../../feed/domain/PictureKind';

/**
 * Stories are NIP-68 picture events (kind 20) with a NIP-40 `expiration` tag.
 * Durable feed posts are the same kind without expiration.
 */
export const STORY_KIND = PICTURE_EVENT_KIND;

export {hasExpirationTag} from '../../feed/domain/PictureKind';

/** Default story time-to-live: 24 hours. */
export const STORY_TTL_SECONDS = 86_400 as const;

/** V1 story media: image-only JPEG / PNG / WebP. */
export const STORY_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type StoryImageMimeType = (typeof STORY_IMAGE_MIME_TYPES)[number];

export function normalizeStoryImageMimeType(mimeType: string): string {
  const normalized = mimeType.trim().toLowerCase();
  if (normalized === 'image/jpg') {
    return 'image/jpeg';
  }
  return normalized;
}

export function isStoryImageMimeType(mimeType: string): mimeType is StoryImageMimeType {
  const normalized = normalizeStoryImageMimeType(mimeType);
  return (STORY_IMAGE_MIME_TYPES as readonly string[]).includes(normalized);
}

/** Best-effort MIME guess from URL extension when imeta omits `m`. */
export function guessStoryImageMimeFromUrl(url: string): string | undefined {
  const path = url.split('?')[0]?.toLowerCase() ?? '';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (path.endsWith('.png')) {
    return 'image/png';
  }
  if (path.endsWith('.webp')) {
    return 'image/webp';
  }
  return undefined;
}
