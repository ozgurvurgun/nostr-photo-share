import type {BunkerSigner} from 'nostr-tools/nip46';
import {SignerUnavailableError} from '../../../core/errors/errors';
import {err, ok, type Result} from '../../../core/result/Result';
import type {ISigner, SignableEvent, SignedEvent} from '../application/ports/ISigner';

function toMutableTags(tags: readonly (readonly string[])[]): string[][] {
  return tags.map(tag => [...tag]);
}

/**
 * Adapts nostr-tools BunkerSigner to the app ISigner port.
 */
export class Nip46SignerAdapter implements ISigner {
  constructor(private readonly bunker: BunkerSigner) {}

  async getPublicKey(): Promise<Result<string, SignerUnavailableError>> {
    try {
      return ok(await this.bunker.getPublicKey());
    } catch (cause) {
      return err(new SignerUnavailableError('Failed to read bunker public key', {cause}));
    }
  }

  async signEvent(event: SignableEvent): Promise<Result<SignedEvent, SignerUnavailableError>> {
    try {
      const signed = await this.bunker.signEvent({
        created_at: event.created_at,
        kind: event.kind,
        tags: toMutableTags(event.tags),
        content: event.content,
      });
      return ok({
        id: signed.id,
        pubkey: signed.pubkey,
        created_at: signed.created_at,
        kind: signed.kind,
        tags: signed.tags,
        content: signed.content,
        sig: signed.sig,
      });
    } catch (cause) {
      return err(new SignerUnavailableError('Failed to sign via bunker', {cause}));
    }
  }

  async close(): Promise<void> {
    await this.bunker.close();
  }

  async logout(): Promise<void> {
    await this.bunker.logout();
  }
}
