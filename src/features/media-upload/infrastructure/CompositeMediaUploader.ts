import {err, type Result} from '../../../core/result/Result';
import {MediaUploadError} from '../domain/errors';
import type {
  IMediaUploader,
  MediaUploadRequest,
  MediaUploadResult,
} from '../application/ports/IMediaUploader';

export type CompositeMediaUploaderOptions = {
  readonly primary: IMediaUploader;
  readonly fallback?: IMediaUploader | null;
  /** When true, try fallback after primary failure. Default true when fallback is set. */
  readonly enableFallback?: boolean;
};

/**
 * Prefer Blossom (primary). Optionally fall back to NIP-96 when configured.
 */
export class CompositeMediaUploader implements IMediaUploader {
  private readonly primary: IMediaUploader;
  private readonly fallback: IMediaUploader | null;
  private readonly enableFallback: boolean;

  constructor(options: CompositeMediaUploaderOptions) {
    this.primary = options.primary;
    this.fallback = options.fallback ?? null;
    this.enableFallback =
      options.enableFallback ?? this.fallback !== null;
  }

  async upload(
    request: MediaUploadRequest,
  ): Promise<Result<MediaUploadResult, MediaUploadError>> {
    const primaryResult = await this.primary.upload(request);
    if (primaryResult.ok) {
      return primaryResult;
    }

    if (!this.enableFallback || this.fallback === null) {
      return primaryResult;
    }

    const fallbackResult = await this.fallback.upload(request);
    if (fallbackResult.ok) {
      return fallbackResult;
    }

    return err(
      new MediaUploadError(
        `Primary and fallback uploads failed: ${primaryResult.error.message}; ${fallbackResult.error.message}`,
      ),
    );
  }
}
