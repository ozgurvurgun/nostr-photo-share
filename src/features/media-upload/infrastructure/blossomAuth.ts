import type {ISigner, SignableEvent, SignedEvent} from '../../auth/application/ports/ISigner';
import {err, ok, type Result} from '../../../core/result/Result';
import {MediaAuthError} from '../domain/errors';
import {encodeBase64UrlNoPad, signedEventToJson} from './encoding';

export const BLOSSOM_AUTH_KIND = 24242;
export const DEFAULT_BLOSSOM_AUTH_TTL_SECONDS = 5 * 60;

export type BuildBlossomUploadAuthInput = {
  readonly sha256: string;
  readonly content?: string;
  /** Unix seconds; defaults to now. */
  readonly createdAt?: number;
  /** Seconds from createdAt until expiration; default 5 minutes. */
  readonly ttlSeconds?: number;
  /** Optional server hostname for BUD-11 `server` tag scoping. */
  readonly serverHost?: string;
};

/**
 * Build and sign a BUD-11 kind 24242 upload authorization event,
 * returning `Authorization: Nostr <base64url-no-pad>`.
 */
export async function buildBlossomUploadAuthorization(
  signer: ISigner,
  input: BuildBlossomUploadAuthInput,
): Promise<Result<{authorization: string; event: SignedEvent}, MediaAuthError>> {
  const createdAt = input.createdAt ?? Math.floor(Date.now() / 1000);
  const ttl = input.ttlSeconds ?? DEFAULT_BLOSSOM_AUTH_TTL_SECONDS;
  const expiration = createdAt + ttl;
  const sha256 = input.sha256.trim().toLowerCase();

  const tags: string[][] = [
    ['t', 'upload'],
    ['expiration', String(expiration)],
    ['x', sha256],
  ];
  if (input.serverHost && input.serverHost.trim().length > 0) {
    tags.push(['server', input.serverHost.trim().toLowerCase()]);
  }

  const unsigned: SignableEvent = {
    kind: BLOSSOM_AUTH_KIND,
    created_at: createdAt,
    tags,
    content: input.content ?? 'Upload Blob',
  };

  const signed = await signer.signEvent(unsigned);
  if (!signed.ok) {
    return err(new MediaAuthError(signed.error.message, {cause: signed.error}));
  }

  const encoded = encodeBase64UrlNoPad(signedEventToJson(signed.value));
  return ok({
    authorization: `Nostr ${encoded}`,
    event: signed.value,
  });
}
