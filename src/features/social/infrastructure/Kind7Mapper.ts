import {err, type Result} from '../../../core/result/Result';
import type {SignedNostrEvent} from '../../../infrastructure/nostr/protocol/event';
import {InvalidReactionError} from '../domain/errors';
import {REACTION_KIND} from '../domain/kinds';
import {Reaction} from '../domain/Reaction';

function lastTag(
  tags: readonly (readonly string[])[],
  name: string,
): readonly string[] | undefined {
  for (let i = tags.length - 1; i >= 0; i -= 1) {
    const tag = tags[i];
    if (tag?.[0] === name) {
      return tag;
    }
  }
  return undefined;
}

/**
 * Maps NIP-25 kind:7 reaction events ↔ Reaction.
 * When multiple e/p tags exist, NIP-25 says the last is the target.
 */
export const Kind7Mapper = {
  fromEvent(event: SignedNostrEvent): Result<Reaction, InvalidReactionError> {
    if (event.kind !== REACTION_KIND) {
      return err(new InvalidReactionError(`Expected kind ${REACTION_KIND}`));
    }

    const eTag = lastTag(event.tags, 'e');
    const pTag = lastTag(event.tags, 'p');
    const kTag = lastTag(event.tags, 'k');

    const targetEventId = eTag?.[1]?.trim().toLowerCase();
    const targetAuthorPubkeyHex = pTag?.[1]?.trim().toLowerCase();
    if (!targetEventId || !targetAuthorPubkeyHex) {
      return err(new InvalidReactionError('Reaction requires e and p tags'));
    }

    let targetKind: number | undefined;
    if (kTag?.[1] !== undefined) {
      const parsed = Number(kTag[1]);
      if (!Number.isInteger(parsed) || parsed < 0) {
        return err(new InvalidReactionError('Invalid k tag'));
      }
      targetKind = parsed;
    }

    return Reaction.create({
      id: event.id,
      authorPubkeyHex: event.pubkey,
      targetEventId,
      targetAuthorPubkeyHex,
      targetKind,
      content: event.content,
      createdAt: event.created_at,
    });
  },
} as const;
