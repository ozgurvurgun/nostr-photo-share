import {AppError, type AppErrorOptions} from '../../../core/errors/errors';

export class InvalidFollowListError extends AppError {
  constructor(message = 'Invalid follow list', options?: AppErrorOptions) {
    super('INVALID_FOLLOW_LIST', message, options);
  }
}

export class InvalidReactionError extends AppError {
  constructor(message = 'Invalid reaction', options?: AppErrorOptions) {
    super('INVALID_REACTION', message, options);
  }
}

export class InvalidCommentError extends AppError {
  constructor(message = 'Invalid comment', options?: AppErrorOptions) {
    super('INVALID_COMMENT', message, options);
  }
}

export class SocialFetchError extends AppError {
  constructor(message = 'Failed to fetch social data', options?: AppErrorOptions) {
    super('SOCIAL_FETCH', message, options);
  }
}

export class SocialPublishError extends AppError {
  constructor(message = 'Failed to publish social event', options?: AppErrorOptions) {
    super('SOCIAL_PUBLISH', message, options);
  }
}
