import {SignerUnavailableError} from '../../../core/errors/errors';
import {err, ok, type Result} from '../../../core/result/Result';
import type {
  ISigner,
  SignableEvent,
  SignedEvent,
} from '../../../features/auth/application/ports/ISigner';
import {nostrToolsCryptoAdapter} from './nostrToolsCryptoAdapter';

export class InMemoryNostrToolsSigner implements ISigner {
  private constructor(private readonly secretKey: Uint8Array) {}

  static generate(): InMemoryNostrToolsSigner {
    return new InMemoryNostrToolsSigner(nostrToolsCryptoAdapter.generateSecretKey());
  }

  static fromSecretKey(secretKey: Uint8Array): InMemoryNostrToolsSigner {
    return new InMemoryNostrToolsSigner(secretKey);
  }

  async getPublicKey(): Promise<Result<string, SignerUnavailableError>> {
    try {
      return ok(nostrToolsCryptoAdapter.getPublicKey(this.secretKey));
    } catch (cause) {
      return err(new SignerUnavailableError('Failed to read public key', {cause}));
    }
  }

  async signEvent(event: SignableEvent): Promise<Result<SignedEvent, SignerUnavailableError>> {
    try {
      return ok(nostrToolsCryptoAdapter.finalizeEvent(event, this.secretKey));
    } catch (cause) {
      return err(new SignerUnavailableError('Failed to sign event', {cause}));
    }
  }
}
