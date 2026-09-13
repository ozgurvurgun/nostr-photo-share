/** NIP-68 picture-first event kind. */
export const PICTURE_EVENT_KIND = 20 as const;

/**
 * NIP-40 expiration tag present -> treat as ephemeral (story), not a durable feed post.
 */
export function hasExpirationTag(tags: readonly (readonly string[])[]): boolean {
  return tags.some(tag => tag[0] === 'expiration' && (tag[1]?.trim().length ?? 0) > 0);
}

/** MIME types accepted when reading NIP-68 picture events. */
export const NIP68_IMAGE_MIME_TYPES = [
  'image/apng',
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type Nip68ImageMimeType = (typeof NIP68_IMAGE_MIME_TYPES)[number];

/** Normalize aliases used by some clients (e.g. image/jpg). */
export function normalizeNip68ImageMimeType(mimeType: string): string {
  const normalized = mimeType.trim().toLowerCase();
  if (normalized === 'image/jpg') {
    return 'image/jpeg';
  }
  return normalized;
}

export function isNip68ImageMimeType(mimeType: string): mimeType is Nip68ImageMimeType {
  const normalized = normalizeNip68ImageMimeType(mimeType);
  return (NIP68_IMAGE_MIME_TYPES as readonly string[]).includes(normalized);
}

/** Best-effort MIME guess from URL extension when imeta omits `m`. */
export function guessImageMimeFromUrl(url: string): string | undefined {
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
  if (path.endsWith('.gif')) {
    return 'image/gif';
  }
  if (path.endsWith('.avif')) {
    return 'image/avif';
  }
  if (path.endsWith('.apng')) {
    return 'image/apng';
  }
  return undefined;
}
