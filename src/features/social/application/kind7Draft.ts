import type {SignableEvent} from '../../auth/application/ports/ISigner';
import {LIKE_CONTENT, REACTION_KIND} from '../domain/kinds';

export type Kind7LikeDraftInput = {
  readonly targetEventId: string;
  readonly targetAuthorPubkeyHex: string;
  /** Target event kind as string tag value, e.g. "20" for picture posts. */
  readonly targetKind?: number;
  readonly createdAt?: number;
};

/**
 * Builds an unsigned NIP-25 kind:7 like reaction (`+`).
 */
export function buildKind7LikeUnsignedEvent(input: Kind7LikeDraftInput): SignableEvent {
  const targetEventId = input.targetEventId.trim().toLowerCase();
  const targetAuthor = input.targetAuthorPubkeyHex.trim().toLowerCase();
  const tags: (readonly string[])[] = [
    ['e', targetEventId],
    ['p', targetAuthor],
  ];
  if (input.targetKind !== undefined) {
    tags.push(['k', String(input.targetKind)]);
  }

  return {
    kind: REACTION_KIND,
    created_at: input.createdAt ?? Math.floor(Date.now() / 1000),
    tags,
    content: LIKE_CONTENT,
  };
}
