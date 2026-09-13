import {launchImageLibrary, type Asset} from 'react-native-image-picker';
import {err, ok, type Result} from '../../../core/result/Result';
import type {SelectedImage} from '../domain/ImageAttachment';
import {normalizeImageMimeType} from '../domain/ImageConstraints';
import {ImagePickerError} from '../domain/errors';
import type {IImagePicker, PickImageOptions} from '../application/ports/IImagePicker';

/**
 * React Native image library picker (JPEG/PNG/WebP via MIME filter where supported).
 */
export class ReactNativeImagePicker implements IImagePicker {
  async pickImage(
    options: PickImageOptions = {},
  ): Promise<Result<SelectedImage | null, ImagePickerError>> {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: options.selectionLimit ?? 1,
        includeBase64: false,
      });

      if (result.didCancel) {
        return ok(null);
      }
      if (result.errorCode) {
        return err(
          new ImagePickerError(
            result.errorMessage ?? `Image picker error: ${result.errorCode}`,
          ),
        );
      }

      const asset = result.assets?.[0];
      if (!asset) {
        return ok(null);
      }

      const mapped = mapAssetToSelectedImage(asset);
      if (!mapped.ok) {
        return mapped;
      }
      return ok(mapped.value);
    } catch (cause) {
      return err(new ImagePickerError('Image picker failed', {cause}));
    }
  }
}

export function mapAssetToSelectedImage(
  asset: Asset,
): Result<SelectedImage, ImagePickerError> {
  const uri = asset.uri?.trim();
  if (!uri) {
    return err(new ImagePickerError('Selected image is missing a URI'));
  }

  const mimeType = normalizeImageMimeType(asset.type ?? '');
  if (mimeType.length === 0) {
    return err(new ImagePickerError('Selected image is missing a MIME type'));
  }

  const sizeBytes = asset.fileSize;
  if (sizeBytes === undefined || sizeBytes === null || sizeBytes <= 0) {
    return err(new ImagePickerError('Selected image is missing file size'));
  }

  return ok({
    uri,
    mimeType,
    sizeBytes,
    width: asset.width,
    height: asset.height,
    fileName: asset.fileName ?? undefined,
  });
}
