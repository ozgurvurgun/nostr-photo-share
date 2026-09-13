/** Allowed image MIME types for V1 uploads. */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

/** Default max upload size: 10 MiB. */
export const DEFAULT_MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Reject absurd dimensions (per side). */
export const DEFAULT_MAX_IMAGE_DIMENSION = 8192;

export type ImageConstraints = {
  readonly allowedMimeTypes: readonly AllowedImageMimeType[];
  readonly maxBytes: number;
  readonly maxDimension: number;
};

export const DEFAULT_IMAGE_CONSTRAINTS: ImageConstraints = {
  allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES,
  maxBytes: DEFAULT_MAX_IMAGE_BYTES,
  maxDimension: DEFAULT_MAX_IMAGE_DIMENSION,
};

/** Normalize common aliases (e.g. image/jpg → image/jpeg). */
export function normalizeImageMimeType(mimeType: string): string {
  const normalized = mimeType.trim().toLowerCase();
  if (normalized === 'image/jpg') {
    return 'image/jpeg';
  }
  return normalized;
}

export function isAllowedImageMimeType(
  mimeType: string,
  allowed: readonly string[] = ALLOWED_IMAGE_MIME_TYPES,
): mimeType is AllowedImageMimeType {
  const normalized = normalizeImageMimeType(mimeType);
  return allowed.some(m => m === normalized);
}

/**
 * Prefer client/validated MIME when server returns a non-allowed type
 * (e.g. application/octet-stream from Blossom).
 */
export function resolveImageMimeType(
  serverMime: string | undefined,
  clientMime: string,
  allowed: readonly string[] = ALLOWED_IMAGE_MIME_TYPES,
): string {
  if (serverMime && isAllowedImageMimeType(serverMime, allowed)) {
    return normalizeImageMimeType(serverMime);
  }
  return normalizeImageMimeType(clientMime);
}
