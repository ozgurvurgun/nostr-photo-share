import {AppError, type AppErrorOptions} from '../../../core/errors/errors';

export class InvalidPublicKeyError extends AppError {
  constructor(message = 'Invalid public key', options?: AppErrorOptions) {
    super('INVALID_PUBLIC_KEY', message, options);
  }
}

export class InvalidNsecError extends AppError {
  constructor(message = 'Invalid nsec', options?: AppErrorOptions) {
    super('INVALID_NSEC', message, options);
  }
}

export class Nip19DecodeError extends AppError {
  constructor(message = 'Invalid NIP-19 identifier', options?: AppErrorOptions) {
    super('NIP19_DECODE', message, options);
  }
}

export class IdentityStorageError extends AppError {
  constructor(message = 'Identity storage failed', options?: AppErrorOptions) {
    super('IDENTITY_STORAGE', message, options);
  }
}

export class BunkerConnectionError extends AppError {
  constructor(message = 'Bunker connection failed', options?: AppErrorOptions) {
    super('BUNKER_CONNECTION', message, options);
  }
}

export class SessionRestoreError extends AppError {
  constructor(message = 'Session restore failed', options?: AppErrorOptions) {
    super('SESSION_RESTORE', message, options);
  }
}
