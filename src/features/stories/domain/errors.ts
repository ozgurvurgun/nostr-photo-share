import {AppError, type AppErrorOptions} from '../../../core/errors/errors';

export class InvalidStoryError extends AppError {
  constructor(message = 'Invalid story', options?: AppErrorOptions) {
    super('INVALID_STORY', message, options);
  }
}

export class StoryExpiredError extends AppError {
  constructor(message = 'Story has expired', options?: AppErrorOptions) {
    super('STORY_EXPIRED', message, options);
  }
}

export class StoryFetchError extends AppError {
  constructor(message = 'Failed to fetch stories', options?: AppErrorOptions) {
    super('STORY_FETCH', message, options);
  }
}

export class StoryPublishError extends AppError {
  constructor(message = 'Failed to publish story', options?: AppErrorOptions) {
    super('STORY_PUBLISH', message, options);
  }
}
