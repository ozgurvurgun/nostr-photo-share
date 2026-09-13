import {err, ok, type Result} from '../../../core/result/Result';
import {InvalidCommentError} from './errors';

export const MAX_COMMENT_LENGTH = 2_000;

export type CommentProps = {
  readonly id: string;
  readonly authorPubkeyHex: string;
  readonly content: string;
  readonly createdAt: number;
  readonly rootEventId: string;
  readonly rootAuthorPubkeyHex: string;
  readonly rootKind: number;
  readonly parentEventId: string;
  readonly parentAuthorPubkeyHex: string;
  readonly parentKind: number;
};

/**
 * NIP-22 kind:1111 comment. Root points at the picture; parent is the reply target.
 */
export class Comment {
  private constructor(
    readonly id: string,
    readonly authorPubkeyHex: string,
    readonly content: string,
    readonly createdAt: number,
    readonly rootEventId: string,
    readonly rootAuthorPubkeyHex: string,
    readonly rootKind: number,
    readonly parentEventId: string,
    readonly parentAuthorPubkeyHex: string,
    readonly parentKind: number,
  ) {}

  get isTopLevel(): boolean {
    return this.parentEventId === this.rootEventId;
  }

  static create(props: CommentProps): Result<Comment, InvalidCommentError> {
    const id = props.id.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(id)) {
      return err(new InvalidCommentError('Comment id must be 64 hex characters'));
    }

    const authorPubkeyHex = props.authorPubkeyHex.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(authorPubkeyHex)) {
      return err(new InvalidCommentError('Author pubkey must be 64 hex characters'));
    }

    const content = props.content.trim();
    if (content.length === 0) {
      return err(new InvalidCommentError('Comment content is required'));
    }
    if (content.length > MAX_COMMENT_LENGTH) {
      return err(
        new InvalidCommentError(`Comment must be at most ${MAX_COMMENT_LENGTH} characters`),
      );
    }

    const rootEventId = props.rootEventId.trim().toLowerCase();
    const parentEventId = props.parentEventId.trim().toLowerCase();
    const rootAuthorPubkeyHex = props.rootAuthorPubkeyHex.trim().toLowerCase();
    const parentAuthorPubkeyHex = props.parentAuthorPubkeyHex.trim().toLowerCase();

    for (const [label, value] of [
      ['Root event id', rootEventId],
      ['Parent event id', parentEventId],
      ['Root author pubkey', rootAuthorPubkeyHex],
      ['Parent author pubkey', parentAuthorPubkeyHex],
    ] as const) {
      if (!/^[0-9a-f]{64}$/.test(value)) {
        return err(new InvalidCommentError(`${label} must be 64 hex characters`));
      }
    }

    if (!Number.isInteger(props.rootKind) || props.rootKind < 0) {
      return err(new InvalidCommentError('Root kind must be a non-negative integer'));
    }
    if (!Number.isInteger(props.parentKind) || props.parentKind < 0) {
      return err(new InvalidCommentError('Parent kind must be a non-negative integer'));
    }

    return ok(
      new Comment(
        id,
        authorPubkeyHex,
        content,
        props.createdAt,
        rootEventId,
        rootAuthorPubkeyHex,
        props.rootKind,
        parentEventId,
        parentAuthorPubkeyHex,
        props.parentKind,
      ),
    );
  }
}
