import {hexToBytes, wipeBytes} from '../../../core/utilities/hex';
import {SignerUnavailableError} from '../../../core/errors/errors';
import {err, ok, type Result} from '../../../core/result/Result';
import type {ISigner, SignableEvent, SignedEvent} from '../application/ports/ISigner';
import {nostrToolsCryptoAdapter} from '../../../infrastructure/nostr/crypto/nostrToolsCryptoAdapter';
import type {IIdentitySessionStore} from '../application/ports/IIdentitySessionStore';

/**
 * Signs with the local secret key loaded from secure storage on each use.
 */
export class LocalSigner implements ISigner {
  constructor(private readonly store: IIdentitySessionStore) {}

  async getPublicKey(): Promise<Result<string, SignerUnavailableError>> {
    try {
      const session = await this.store.loadSession();
      if (!session.ok) {
        return err(new SignerUnavailableError('Failed to read session', {cause: session.error}));
      }
      if (session.value === null) {
        return err(new SignerUnavailableError('No active local identity'));
      }
      return ok(session.value.pubkeyHex);
    } catch (cause) {
      return err(new SignerUnavailableError('Failed to read public key', {cause}));
    }
  }

  async signEvent(event: SignableEvent): Promise<Result<SignedEvent, SignerUnavailableError>> {
    let secretKey: Uint8Array | null = null;
    try {
      const secretResult = await this.store.loadSecretKeyHex();
      if (!secretResult.ok) {
        return err(
          new SignerUnavailableError('Failed to read secret key', {cause: secretResult.error}),
        );
      }
      if (secretResult.value === null) {
        return err(new SignerUnavailableError('No secret key in secure storage'));
      }

      secretKey = hexToBytes(secretResult.value);
      return ok(nostrToolsCryptoAdapter.finalizeEvent(event, secretKey));
    } catch (cause) {
      return err(new SignerUnavailableError('Failed to sign event', {cause}));
    } finally {
      if (secretKey !== null) {
        wipeBytes(secretKey);
      }
    }
  }
}
