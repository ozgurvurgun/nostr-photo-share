import {nostrToolsCryptoAdapter} from '../../../infrastructure/nostr/crypto/nostrToolsCryptoAdapter';
import type {IKeyGenerator} from '../application/ports/IKeyGenerator';

export class NostrToolsKeyGenerator implements IKeyGenerator {
  generateSecretKey(): Uint8Array {
    return nostrToolsCryptoAdapter.generateSecretKey();
  }

  getPublicKeyHex(secretKey: Uint8Array): string {
    return nostrToolsCryptoAdapter.getPublicKey(secretKey);
  }
}
