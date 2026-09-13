import {SignerUnavailableError} from '../../../core/errors/errors';
import {err, type Result} from '../../../core/result/Result';
import {
  ImageAttachment,
  validateSelectedImage,
  type SelectedImage,
} from '../domain/ImageAttachment';
import {
  DEFAULT_IMAGE_CONSTRAINTS,
  detectImageMimeFromBytes,
  resolveImageMimeType,
  type ImageConstraints,
} from '../domain/ImageConstraints';
import {
  ImagePickerError,
  ImageReadError,
  InvalidImageError,
  MediaUploadError,
} from '../domain/errors';
import type {IBlobHasher} from './ports/IBlobHasher';
import type {IImageFileReader} from './ports/IImageFileReader';
import type {IImagePicker} from './ports/IImagePicker';
import type {IMediaUploader} from './ports/IMediaUploader';

export type UploadImageInput = {
  /** Pre-selected image; when omitted, the picker is invoked. */
  readonly selected?: SelectedImage;
  readonly onProgress?: (progress: number) => void;
  readonly alt?: string;
};

export type UploadImageError =
  | InvalidImageError
  | ImagePickerError
  | ImageReadError
  | MediaUploadError
  | SignerUnavailableError;

/**
 * Pick (optional) -> validate -> read bytes -> hash -> upload -> ImageAttachment.
 * Does not publish Nostr posts (Phase 4).
 */
export class UploadImageUseCase {
  constructor(
    private readonly imagePicker: IImagePicker,
    private readonly fileReader: IImageFileReader,
    private readonly mediaUploader: IMediaUploader,
    private readonly blobHasher: IBlobHasher,
    private readonly constraints: ImageConstraints = DEFAULT_IMAGE_CONSTRAINTS,
  ) {}

  async execute(input: UploadImageInput = {}): Promise<Result<ImageAttachment, UploadImageError>> {
    let selected = input.selected;
    if (selected === undefined) {
      const picked = await this.imagePicker.pickImage();
      if (!picked.ok) {
        return picked;
      }
      if (picked.value === null) {
        return err(new ImagePickerError('Image selection cancelled'));
      }
      selected = picked.value;
    }

    const validated = validateSelectedImage(selected, this.constraints);
    if (!validated.ok) {
      return validated;
    }

    const bytesResult = await this.fileReader.readBytes(validated.value.uri);
    if (!bytesResult.ok) {
      return bytesResult;
    }
    const bytes = bytesResult.value;
    if (bytes.byteLength === 0) {
      return err(new InvalidImageError('Image file is empty'));
    }
    if (bytes.byteLength > this.constraints.maxBytes) {
      return err(
        new InvalidImageError(
          `Image exceeds max size of ${this.constraints.maxBytes} bytes`,
        ),
      );
    }

    const detectedMime = detectImageMimeFromBytes(bytes);
    if (detectedMime === null) {
      return err(
        new InvalidImageError(
          'Image content is not a supported JPEG, PNG, or WebP file',
        ),
      );
    }
    if (detectedMime !== validated.value.mimeType) {
      return err(
        new InvalidImageError(
          `Image content MIME (${detectedMime}) does not match declared type (${validated.value.mimeType})`,
        ),
      );
    }

    const hashHex = this.blobHasher.sha256Hex(bytes);

    const uploadResult = await this.mediaUploader.upload({
      bytes,
      mimeType: detectedMime,
      sha256: hashHex,
      fileName: validated.value.fileName,
      onProgress: input.onProgress,
    });
    if (!uploadResult.ok) {
      return uploadResult;
    }

    return ImageAttachment.create(
      {
        url: uploadResult.value.url,
        mimeType: resolveImageMimeType(
          uploadResult.value.mimeType,
          detectedMime,
          this.constraints.allowedMimeTypes,
        ),
        sizeBytes: uploadResult.value.sizeBytes || bytes.byteLength,
        width: validated.value.width,
        height: validated.value.height,
        sha256: uploadResult.value.sha256 || hashHex,
        alt: input.alt,
      },
      this.constraints,
    );
  }
}
