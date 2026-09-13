import type {SignableEvent} from '../../auth/application/ports/ISigner';
import {COMMENT_KIND} from '../domain/kinds';

export type Kind1111CommentDraftInput = {
  readonly content: string;
  readonly rootEventId: string;
  readonly rootAuthorPubkeyHex: string;
  readonly rootKind: number;
  readonly parentEventId: string;
  readonly parentAuthorPubkeyHex: string;
  readonly parentKind: number;
  readonly createdAt?: number;
};

/**
 * Builds an unsigned NIP-22 kind:1111 comment.
 * Top-level on a picture: root and parent tags share the same values.
 * Reply: root stays on the picture; parent points at the comment (kind 1111).
 */
export function buildKind1111UnsignedEvent(input: Kind1111CommentDraftInput): SignableEvent {
  const rootEventId = input.rootEventId.trim().toLowerCase();
  const rootAuthor = input.rootAuthorPubkeyHex.trim().toLowerCase();
  const parentEventId = input.parentEventId.trim().toLowerCase();
  const parentAuthor = input.parentAuthorPubkeyHex.trim().toLowerCase();

  const tags: (readonly string[])[] = [
    ['E', rootEventId, '', rootAuthor],
    ['K', String(input.rootKind)],
    ['P', rootAuthor],
    ['e', parentEventId, '', parentAuthor],
    ['k', String(input.parentKind)],
    ['p', parentAuthor],
  ];

  return {
    kind: COMMENT_KIND,
    created_at: input.createdAt ?? Math.floor(Date.now() / 1000),
    tags,
    content: input.content.trim(),
  };
}
