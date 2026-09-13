import {SignerUnavailableError} from '../../../core/errors/errors';
import {err, ok, type Result} from '../../../core/result/Result';
import type {ISigner} from '../../auth/application/ports/ISigner';
import {PICTURE_EVENT_KIND} from '../../feed/domain/PictureKind';
import {Comment, MAX_COMMENT_LENGTH} from '../domain/Comment';
import {InvalidCommentError, SocialPublishError} from '../domain/errors';
import {COMMENT_KIND} from '../domain/kinds';
import {buildKind1111UnsignedEvent} from './kind1111Draft';
import type {ICommentCache} from './ports/ICommentCache';
import type {ISocialRepository} from './ports/ISocialRepository';

export type CommentOnPostError =
  | SignerUnavailableError
  | InvalidCommentError
  | SocialPublishError;

export type CommentOnPostInput = {
  readonly content: string;
  /** Root picture event id. */
  readonly rootEventId: string;
  readonly rootAuthorPubkeyHex: string;
  readonly rootKind?: number;
  /**
   * When commenting on a picture (top-level), omit or set equal to root.
   * When replying to a comment, set parent to that comment.
   */
  readonly parentEventId?: string;
  readonly parentAuthorPubkeyHex?: string;
  readonly parentKind?: number;
};

/**
 * Publishes a NIP-22 kind:1111 comment (top-level or reply).
 */
export class CommentOnPostUseCase {
  constructor(
    private readonly repository: ISocialRepository,
    private readonly commentCache: ICommentCache | null,
    private readonly getSigner: () => ISigner | null,
  ) {}

  async execute(input: CommentOnPostInput): Promise<Result<Comment, CommentOnPostError>> {
    const signer = this.getSigner();
    if (signer === null) {
      return err(new SignerUnavailableError('No signer available to comment'));
    }

    const content = input.content.trim();
    if (content.length === 0) {
      return err(new InvalidCommentError('Comment content is required'));
    }
    if (content.length > MAX_COMMENT_LENGTH) {
      return err(
        new InvalidCommentError(`Comment must be at most ${MAX_COMMENT_LENGTH} characters`),
      );
    }

    const rootEventId = input.rootEventId.trim().toLowerCase();
    const rootAuthorPubkeyHex = input.rootAuthorPubkeyHex.trim().toLowerCase();
    const rootKind = input.rootKind ?? PICTURE_EVENT_KIND;

    const parentEventId = (input.parentEventId ?? rootEventId).trim().toLowerCase();
    const parentAuthorPubkeyHex = (
      input.parentAuthorPubkeyHex ?? rootAuthorPubkeyHex
    )
      .trim()
      .toLowerCase();
    const parentKind =
      input.parentKind ?? (parentEventId === rootEventId ? rootKind : COMMENT_KIND);

    const draft = buildKind1111UnsignedEvent({
      content,
      rootEventId,
      rootAuthorPubkeyHex,
      rootKind,
      parentEventId,
      parentAuthorPubkeyHex,
      parentKind,
    });

    const signed = await signer.signEvent(draft);
    if (!signed.ok) {
      return signed;
    }

    const publishResult = await this.repository.publish({
      id: signed.value.id,
      pubkey: signed.value.pubkey,
      created_at: signed.value.created_at,
      kind: signed.value.kind,
      tags: signed.value.tags,
      content: signed.value.content,
      sig: signed.value.sig,
    });
    if (!publishResult.ok) {
      return publishResult;
    }

    const comment = Comment.create({
      id: signed.value.id,
      authorPubkeyHex: signed.value.pubkey,
      content: signed.value.content,
      createdAt: signed.value.created_at,
      rootEventId,
      rootAuthorPubkeyHex,
      rootKind,
      parentEventId,
      parentAuthorPubkeyHex,
      parentKind,
    });
    if (!comment.ok) {
      return comment;
    }

    if (this.commentCache) {
      const existing = this.commentCache.get(rootEventId)?.comments ?? [];
      const withoutDup = existing.filter(item => item.id !== comment.value.id);
      this.commentCache.set(rootEventId, [...withoutDup, comment.value]);
    }

    return ok(comment.value);
  }
}
