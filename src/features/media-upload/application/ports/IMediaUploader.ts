import type {Result} from '../../../../core/result/Result';
import type {MediaUploadError} from '../../domain/errors';

export type MediaUploadRequest = {
  readonly bytes: Uint8Array;
  readonly mimeType: string;
  readonly sha256: string;
  readonly fileName?: string;
  readonly onProgress?: (progress: number) => void;
};

export type MediaUploadResult = {
  readonly url: string;
  readonly sha256: string;
  readonly sizeBytes: number;
  readonly mimeType: string;
};

export interface IMediaUploader {
  upload(request: MediaUploadRequest): Promise<Result<MediaUploadResult, MediaUploadError>>;
}
