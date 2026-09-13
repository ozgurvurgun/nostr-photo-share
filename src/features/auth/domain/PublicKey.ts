import {isHex64} from '../../../core/utilities/hex';
import {err, ok, type Result} from '../../../core/result/Result';
import {InvalidPublicKeyError} from './errors';

export class PublicKey {
  private constructor(private readonly value: string) {}

  static fromHex(hex: string): Result<PublicKey, InvalidPublicKeyError> {
    const normalized = hex.trim().toLowerCase();
    if (!isHex64(normalized)) {
      return err(new InvalidPublicKeyError('Public key must be 64 lowercase hex characters'));
    }
    return ok(new PublicKey(normalized));
  }

  toHex(): string {
    return this.value;
  }

  equals(other: PublicKey): boolean {
    return this.value === other.value;
  }
}
