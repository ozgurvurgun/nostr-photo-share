import type {ISigner, SignableEvent, SignedEvent} from '../../auth/application/ports/ISigner';
import {err, ok, type Result} from '../../../core/result/Result';
import {MediaAuthError} from '../domain/errors';
import {encodeBase64, signedEventToJson} from './encoding';

export const NIP98_AUTH_KIND = 27235;

export type BuildNip98AuthInput = {
  /** Absolute URL of the request. */
  readonly url: string;
  readonly method: string;
  /** Optional lowercase hex SHA-256 of the request body (payload tag). */
  readonly payloadSha256?: string;
  readonly createdAt?: number;
  readonly content?: string;
};

/**
 * Build and sign a NIP-98 kind 27235 HTTP auth event,
 * returning `Authorization: Nostr <standard base64>`.
 */
export async function buildNip98Authorization(
  signer: ISigner,
  input: BuildNip98AuthInput,
): Promise<Result<{authorization: string; event: SignedEvent}, MediaAuthError>> {
  const createdAt = input.createdAt ?? Math.floor(Date.now() / 1000);
  const method = input.method.trim().toUpperCase();
  const absoluteUrl = input.url.trim();

  if (absoluteUrl.length === 0) {
    return err(new MediaAuthError('NIP-98 requires an absolute URL'));
  }
  if (method.length === 0) {
    return err(new MediaAuthError('NIP-98 requires an HTTP method'));
  }

  const tags: string[][] = [
    ['u', absoluteUrl],
    ['method', method],
  ];
  if (input.payloadSha256 && input.payloadSha256.trim().length > 0) {
    tags.push(['payload', input.payloadSha256.trim().toLowerCase()]);
  }

  const unsigned: SignableEvent = {
    kind: NIP98_AUTH_KIND,
    created_at: createdAt,
    tags,
    content: input.content ?? '',
  };

  const signed = await signer.signEvent(unsigned);
  if (!signed.ok) {
    return err(new MediaAuthError(signed.error.message, {cause: signed.error}));
  }

  const encoded = encodeBase64(signedEventToJson(signed.value));
  return ok({
    authorization: `Nostr ${encoded}`,
    event: signed.value,
  });
}
