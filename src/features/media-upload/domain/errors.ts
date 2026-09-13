import {AppError, type AppErrorOptions} from '../../../core/errors/errors';

export class InvalidImageError extends AppError {
  constructor(message = 'Invalid image', options?: AppErrorOptions) {
    super('INVALID_IMAGE', message, options);
  }
}

export class ImagePickerError extends AppError {
  constructor(message = 'Image selection failed', options?: AppErrorOptions) {
    super('IMAGE_PICKER', message, options);
  }
}

export class ImageReadError extends AppError {
  constructor(message = 'Failed to read image file', options?: AppErrorOptions) {
    super('IMAGE_READ', message, options);
  }
}

export class MediaUploadError extends AppError {
  constructor(message = 'Media upload failed', options?: AppErrorOptions) {
    super('MEDIA_UPLOAD', message, options);
  }
}

export class MediaAuthError extends AppError {
  constructor(message = 'Media auth failed', options?: AppErrorOptions) {
    super('MEDIA_AUTH', message, options);
  }
}
