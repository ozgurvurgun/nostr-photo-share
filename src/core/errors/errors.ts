export type AppErrorOptions = {
  readonly cause?: unknown;
};

export class AppError extends Error {
  readonly code: string;

  constructor(code: string, message: string, options?: AppErrorOptions) {
    super(message, options?.cause === undefined ? undefined : {cause: options.cause});
    this.name = this.constructor.name;
    this.code = code;
  }
}

export class EventValidationError extends AppError {
  constructor(message: string, options?: AppErrorOptions) {
    super('EVENT_VALIDATION', message, options);
  }
}

export class SignatureVerificationError extends AppError {
  constructor(message: string, options?: AppErrorOptions) {
    super('SIGNATURE_VERIFICATION', message, options);
  }
}

export class RelayConnectionError extends AppError {
  constructor(message: string, options?: AppErrorOptions) {
    super('RELAY_CONNECTION', message, options);
  }
}

export class RelayTimeoutError extends AppError {
  constructor(message: string, options?: AppErrorOptions) {
    super('RELAY_TIMEOUT', message, options);
  }
}

export class SignerUnavailableError extends AppError {
  constructor(message: string, options?: AppErrorOptions) {
    super('SIGNER_UNAVAILABLE', message, options);
  }
}
