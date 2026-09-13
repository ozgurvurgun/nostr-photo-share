import {AppError, type AppErrorOptions} from '../../../core/errors/errors';

export class InvalidRelayUrlError extends AppError {
  constructor(message = 'Invalid relay URL', options?: AppErrorOptions) {
    super('INVALID_RELAY_URL', message, options);
  }
}

export class InvalidRelayListError extends AppError {
  constructor(message = 'Invalid relay list', options?: AppErrorOptions) {
    super('INVALID_RELAY_LIST', message, options);
  }
}

export class RelayListFetchError extends AppError {
  constructor(message = 'Failed to fetch relay list', options?: AppErrorOptions) {
    super('RELAY_LIST_FETCH', message, options);
  }
}

export class RelayListPublishError extends AppError {
  constructor(message = 'Failed to publish relay list', options?: AppErrorOptions) {
    super('RELAY_LIST_PUBLISH', message, options);
  }
}
