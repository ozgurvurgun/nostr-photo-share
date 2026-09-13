import {SignerUnavailableError} from '../../../core/errors/errors';
import {err, ok, type Result} from '../../../core/result/Result';
import type {ISigner} from '../../auth/application/ports/ISigner';
import {PICTURE_EVENT_KIND} from '../../feed/domain/PictureKind';
import {InvalidReactionError, SocialPublishError} from '../domain/errors';
import {Reaction} from '../domain/Reaction';
import {buildKind7LikeUnsignedEvent} from './kind7Draft';
import type {IReactionCache} from './ports/IReactionCache';
import type {ISocialRepository} from './ports/ISocialRepository';

export type LikePostError =
  | SignerUnavailableError
  | InvalidReactionError
  | SocialPublishError;

export type LikePostInput = {
  readonly eventId: string;
  readonly authorPubkeyHex: string;
  /** Defaults to kind 20 (picture posts). */
  readonly targetKind?: number;
};

/**
 * Publishes a NIP-25 kind:7 like. Returns the Reaction for optimistic UI reconciliation.
 * If already liked (cached), returns the existing like without republishing.
 */
export class LikePostUseCase {
  constructor(
    private readonly repository: ISocialRepository,
    private readonly reactionCache: IReactionCache | null,
    private readonly getSigner: () => ISigner | null,
  ) {}

  async execute(input: LikePostInput): Promise<Result<Reaction, LikePostError>> {
    const signer = this.getSigner();
    if (signer === null) {
      return err(new SignerUnavailableError('No signer available to like post'));
    }

    const pubkeyResult = await signer.getPublicKey();
    if (!pubkeyResult.ok) {
      return pubkeyResult;
    }
    const authorPubkeyHex = pubkeyResult.value.trim().toLowerCase();
    const eventId = input.eventId.trim().toLowerCase();
    const targetKind = input.targetKind ?? PICTURE_EVENT_KIND;

    const cached = this.reactionCache?.get(eventId)?.summary;
    if (cached?.likedByMe && cached.myReactionId) {
      return Reaction.create({
        id: cached.myReactionId,
        authorPubkeyHex,
        targetEventId: eventId,
        targetAuthorPubkeyHex: input.authorPubkeyHex,
        targetKind,
        content: '+',
        createdAt: Math.floor(Date.now() / 1000),
      });
    }

    const draft = buildKind7LikeUnsignedEvent({
      targetEventId: eventId,
      targetAuthorPubkeyHex: input.authorPubkeyHex,
      targetKind,
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

    const reaction = Reaction.create({
      id: signed.value.id,
      authorPubkeyHex: signed.value.pubkey,
      targetEventId: eventId,
      targetAuthorPubkeyHex: input.authorPubkeyHex,
      targetKind,
      content: signed.value.content,
      createdAt: signed.value.created_at,
    });
    if (!reaction.ok) {
      return reaction;
    }

    if (this.reactionCache) {
      const previous = this.reactionCache.get(eventId)?.summary;
      this.reactionCache.set(eventId, {
        targetEventId: eventId,
        likeCount: (previous?.likeCount ?? 0) + (previous?.likedByMe ? 0 : 1),
        likedByMe: true,
        myReactionId: reaction.value.id,
      });
    }

    return ok(reaction.value);
  }
}
