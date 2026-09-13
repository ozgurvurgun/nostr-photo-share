import {AppError, type AppErrorOptions} from '../../../core/errors/errors';

export class InvalidImagePostError extends AppError {
  constructor(message = 'Invalid image post', options?: AppErrorOptions) {
    super('INVALID_IMAGE_POST', message, options);
  }
}

export class FeedFetchError extends AppError {
  constructor(message = 'Failed to fetch feed', options?: AppErrorOptions) {
    super('FEED_FETCH', message, options);
  }
}

export class FeedPublishError extends AppError {
  constructor(message = 'Failed to publish image post', options?: AppErrorOptions) {
    super('FEED_PUBLISH', message, options);
  }
}
