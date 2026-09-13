import {AppError, type AppErrorOptions} from '../../../core/errors/errors';

export class InvalidNip05Error extends AppError {
  constructor(message = 'Geçersiz doğrulanmış kullanıcı adı', options?: AppErrorOptions) {
    super('INVALID_NIP05', message, options);
  }
}

export class ProfileFetchError extends AppError {
  constructor(message = 'Failed to fetch profile', options?: AppErrorOptions) {
    super('PROFILE_FETCH', message, options);
  }
}

export class ProfilePublishError extends AppError {
  constructor(message = 'Failed to publish profile', options?: AppErrorOptions) {
    super('PROFILE_PUBLISH', message, options);
  }
}

export class ProfileUpdateError extends AppError {
  constructor(message = 'Failed to update profile', options?: AppErrorOptions) {
    super('PROFILE_UPDATE', message, options);
  }
}
