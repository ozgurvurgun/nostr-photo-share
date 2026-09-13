import {err, ok, type Result} from '../../../core/result/Result';
import {
  DEFAULT_IMAGE_CONSTRAINTS,
  isAllowedImageMimeType,
  normalizeImageMimeType,
  type ImageConstraints,
} from './ImageConstraints';
import {InvalidImageError} from './errors';

export type ImageAttachmentProps = {
  readonly url: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly width?: number;
  readonly height?: number;
  readonly sha256?: string;
  readonly alt?: string;
};

/**
 * Validated remote (or pending) image metadata returned after a successful upload.
 * Domain-only: no network or RN imports.
 */
export class ImageAttachment {
  private constructor(
    readonly url: string,
    readonly mimeType: string,
    readonly sizeBytes: number,
    readonly width: number | undefined,
    readonly height: number | undefined,
    readonly sha256: string | undefined,
    readonly alt: string | undefined,
  ) {}

  static create(
    props: ImageAttachmentProps,
    constraints: ImageConstraints = DEFAULT_IMAGE_CONSTRAINTS,
  ): Result<ImageAttachment, InvalidImageError> {
    const mimeType = normalizeImageMimeType(props.mimeType);
    if (!isAllowedImageMimeType(mimeType, constraints.allowedMimeTypes)) {
      return err(
        new InvalidImageError(
          `Unsupported MIME type: ${props.mimeType}. Allowed: ${constraints.allowedMimeTypes.join(', ')}`,
        ),
      );
    }

    if (!Number.isFinite(props.sizeBytes) || props.sizeBytes <= 0) {
      return err(new InvalidImageError('Image size must be a positive number'));
    }
    if (props.sizeBytes > constraints.maxBytes) {
      return err(
        new InvalidImageError(
          `Image exceeds max size of ${constraints.maxBytes} bytes`,
        ),
      );
    }

    const width = props.width;
    const height = props.height;
    if (width !== undefined || height !== undefined) {
      if (
        width === undefined ||
        height === undefined ||
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width <= 0 ||
        height <= 0
      ) {
        return err(new InvalidImageError('Image dimensions must be positive when provided'));
      }
      if (width > constraints.maxDimension || height > constraints.maxDimension) {
        return err(
          new InvalidImageError(
            `Image dimensions exceed max of ${constraints.maxDimension}px`,
          ),
        );
      }
    }

    const url = props.url.trim();
    if (url.length === 0) {
      return err(new InvalidImageError('Image URL is required'));
    }

    let sha256: string | undefined;
    if (props.sha256 !== undefined) {
      const normalized = props.sha256.trim().toLowerCase();
      if (!/^[0-9a-f]{64}$/.test(normalized)) {
        return err(new InvalidImageError('sha256 must be 64 lowercase hex characters'));
      }
      sha256 = normalized;
    }

    const alt = props.alt?.trim();
    return ok(
      new ImageAttachment(
        url,
        mimeType,
        props.sizeBytes,
        width,
        height,
        sha256,
        alt && alt.length > 0 ? alt : undefined,
      ),
    );
  }
}

/** Local selection metadata before upload (no remote URL yet). */
export type SelectedImage = {
  readonly uri: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly width?: number;
  readonly height?: number;
  readonly fileName?: string;
};

export function validateSelectedImage(
  selected: SelectedImage,
  constraints: ImageConstraints = DEFAULT_IMAGE_CONSTRAINTS,
): Result<SelectedImage, InvalidImageError> {
  const mimeType = normalizeImageMimeType(selected.mimeType);
  if (!isAllowedImageMimeType(mimeType, constraints.allowedMimeTypes)) {
    return err(
      new InvalidImageError(
        `Unsupported MIME type: ${selected.mimeType}. Allowed: ${constraints.allowedMimeTypes.join(', ')}`,
      ),
    );
  }

  if (!Number.isFinite(selected.sizeBytes) || selected.sizeBytes <= 0) {
    return err(new InvalidImageError('Image size must be a positive number'));
  }
  if (selected.sizeBytes > constraints.maxBytes) {
    return err(
      new InvalidImageError(`Image exceeds max size of ${constraints.maxBytes} bytes`),
    );
  }

  const {width, height} = selected;
  if (width === undefined || height === undefined) {
    return err(new InvalidImageError('Image width and height are required'));
  }
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return err(new InvalidImageError('Image dimensions must be positive'));
  }
  if (width > constraints.maxDimension || height > constraints.maxDimension) {
    return err(
      new InvalidImageError(
        `Image dimensions exceed max of ${constraints.maxDimension}px`,
      ),
    );
  }

  const uri = selected.uri.trim();
  if (uri.length === 0) {
    return err(new InvalidImageError('Image URI is required'));
  }

  return ok({
    uri,
    mimeType,
    sizeBytes: selected.sizeBytes,
    width,
    height,
    fileName: selected.fileName,
  });
}
