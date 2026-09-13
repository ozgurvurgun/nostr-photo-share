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

/** Normalize common aliases (e.g. image/jpg -> image/jpeg). */
export function normalizeImageMimeType(mimeType: string): string {
  const normalized = mimeType.trim().toLowerCase();
  if (normalized === 'image/jpg') {
    return 'image/jpeg';
  }
  return normalized;
}

/**
 * Detect image MIME from file magic bytes (JPEG / PNG / WebP).
 * Returns null when the content is not a supported image container.
 */
export function detectImageMimeFromBytes(
  bytes: Uint8Array,
): AllowedImageMimeType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
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
