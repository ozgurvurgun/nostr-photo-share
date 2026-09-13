import {
  EventValidationError,
  SignatureVerificationError,
} from '../../../core/errors/errors';
import {err, ok, type Result} from '../../../core/result/Result';
import {isHex128, isHex64} from '../../../core/utilities/hex';
import {nostrToolsCryptoAdapter} from '../crypto/nostrToolsCryptoAdapter';
import type {SignedNostrEvent} from '../protocol/event';

export type EventValidationFailure = EventValidationError | SignatureVerificationError;

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

function parseSignedEvent(input: unknown): Result<SignedNostrEvent, EventValidationError> {
  if (input === null || typeof input !== 'object') {
    return err(new EventValidationError('Event must be an object'));
  }

  const candidate = input as Record<string, unknown>;

  if (typeof candidate.id !== 'string' || !isHex64(candidate.id)) {
    return err(new EventValidationError('Event id must be 64 lowercase hex characters'));
  }
  if (typeof candidate.pubkey !== 'string' || !isHex64(candidate.pubkey)) {
    return err(new EventValidationError('Event pubkey must be 64 lowercase hex characters'));
  }
  if (!isInteger(candidate.created_at)) {
    return err(new EventValidationError('Event created_at must be an integer unix timestamp'));
  }
  if (!isInteger(candidate.kind) || candidate.kind < 0 || candidate.kind > 65535) {
    return err(new EventValidationError('Event kind must be an integer between 0 and 65535'));
  }
  if (typeof candidate.content !== 'string') {
    return err(new EventValidationError('Event content must be a string'));
  }
  if (typeof candidate.sig !== 'string' || !isHex128(candidate.sig)) {
    return err(new EventValidationError('Event sig must be 128 lowercase hex characters'));
  }
  if (!Array.isArray(candidate.tags)) {
    return err(new EventValidationError('Event tags must be an array'));
  }

  const tags: string[][] = [];
  for (const tag of candidate.tags) {
    if (!Array.isArray(tag) || tag.length === 0 || tag.some(part => typeof part !== 'string')) {
      return err(new EventValidationError('Each tag must be a non-empty array of strings'));
    }
    tags.push(tag);
  }

  return ok({
    id: candidate.id,
    pubkey: candidate.pubkey,
    created_at: candidate.created_at,
    kind: candidate.kind,
    tags,
    content: candidate.content,
    sig: candidate.sig,
  });
}

export class EventValidator {
  validate(input: unknown): Result<SignedNostrEvent, EventValidationFailure> {
    const parsed = parseSignedEvent(input);
    if (!parsed.ok) {
      return parsed;
    }

    const event = parsed.value;

    try {
      const expectedId = nostrToolsCryptoAdapter.getEventHash({
        pubkey: event.pubkey,
        created_at: event.created_at,
        kind: event.kind,
        tags: event.tags,
        content: event.content,
      });

      if (expectedId !== event.id) {
        return err(new EventValidationError('Event id does not match NIP-01 hash'));
      }

      if (!nostrToolsCryptoAdapter.verifyEvent(event)) {
        return err(new SignatureVerificationError('Event signature is invalid'));
      }
    } catch (cause) {
      return err(new EventValidationError('Event could not be verified', {cause}));
    }

    return ok(event);
  }
}
