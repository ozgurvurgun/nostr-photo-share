import {err, type Result} from '../../../core/result/Result';
import type {SignedNostrEvent} from '../../../infrastructure/nostr/protocol/event';
import {Comment} from '../domain/Comment';
import {InvalidCommentError} from '../domain/errors';
import {COMMENT_KIND} from '../domain/kinds';

/**
 * Maps NIP-22 kind:1111 comment events ↔ Comment.
 * Addressing: uppercase root tags E/K/P, lowercase parent tags e/k/p.
 */
export const Kind1111Mapper = {
  fromEvent(event: SignedNostrEvent): Result<Comment, InvalidCommentError> {
    if (event.kind !== COMMENT_KIND) {
      return err(new InvalidCommentError(`Expected kind ${COMMENT_KIND}`));
    }

    const rootE = event.tags.find(tag => tag[0] === 'E');
    const rootK = event.tags.find(tag => tag[0] === 'K');
    const rootP = event.tags.find(tag => tag[0] === 'P');
    const parentE = event.tags.find(tag => tag[0] === 'e');
    const parentK = event.tags.find(tag => tag[0] === 'k');
    const parentP = event.tags.find(tag => tag[0] === 'p');

    const rootEventId = rootE?.[1]?.trim().toLowerCase();
    const parentEventId = parentE?.[1]?.trim().toLowerCase();
    const rootAuthorPubkeyHex =
      rootP?.[1]?.trim().toLowerCase() ?? rootE?.[3]?.trim().toLowerCase();
    const parentAuthorPubkeyHex =
      parentP?.[1]?.trim().toLowerCase() ?? parentE?.[3]?.trim().toLowerCase();

    if (!rootEventId || !rootAuthorPubkeyHex || !parentEventId || !parentAuthorPubkeyHex) {
      return err(new InvalidCommentError('Comment requires E/P and e/p addressing tags'));
    }

    const rootKind = rootK?.[1] !== undefined ? Number(rootK[1]) : NaN;
    const parentKind = parentK?.[1] !== undefined ? Number(parentK[1]) : NaN;
    if (!Number.isInteger(rootKind) || rootKind < 0) {
      return err(new InvalidCommentError('Invalid K tag'));
    }
    if (!Number.isInteger(parentKind) || parentKind < 0) {
      return err(new InvalidCommentError('Invalid k tag'));
    }

    return Comment.create({
      id: event.id,
      authorPubkeyHex: event.pubkey,
      content: event.content,
      createdAt: event.created_at,
      rootEventId,
      rootAuthorPubkeyHex,
      rootKind,
      parentEventId,
      parentAuthorPubkeyHex,
      parentKind,
    });
  },
} as const;
