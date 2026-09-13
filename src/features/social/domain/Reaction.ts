import {err, ok, type Result} from '../../../core/result/Result';
import {InvalidReactionError} from './errors';
import {isLikeContent} from './kinds';

export type ReactionProps = {
  readonly id: string;
  readonly authorPubkeyHex: string;
  readonly targetEventId: string;
  readonly targetAuthorPubkeyHex: string;
  readonly targetKind?: number;
  readonly content: string;
  readonly createdAt: number;
};

/**
 * NIP-25 kind:7 reaction. V1 treats `+` / empty content as a like.
 */
export class Reaction {
  private constructor(
    readonly id: string,
    readonly authorPubkeyHex: string,
    readonly targetEventId: string,
    readonly targetAuthorPubkeyHex: string,
    readonly targetKind: number | undefined,
    readonly content: string,
    readonly createdAt: number,
  ) {}

  get isLike(): boolean {
    return isLikeContent(this.content);
  }

  static create(props: ReactionProps): Result<Reaction, InvalidReactionError> {
    const id = props.id.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(id)) {
      return err(new InvalidReactionError('Reaction id must be 64 hex characters'));
    }

    const authorPubkeyHex = props.authorPubkeyHex.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(authorPubkeyHex)) {
      return err(new InvalidReactionError('Author pubkey must be 64 hex characters'));
    }

    const targetEventId = props.targetEventId.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(targetEventId)) {
      return err(new InvalidReactionError('Target event id must be 64 hex characters'));
    }

    const targetAuthorPubkeyHex = props.targetAuthorPubkeyHex.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(targetAuthorPubkeyHex)) {
      return err(new InvalidReactionError('Target author pubkey must be 64 hex characters'));
    }

    if (
      props.targetKind !== undefined &&
      (!Number.isInteger(props.targetKind) || props.targetKind < 0)
    ) {
      return err(new InvalidReactionError('Target kind must be a non-negative integer'));
    }

    return ok(
      new Reaction(
        id,
        authorPubkeyHex,
        targetEventId,
        targetAuthorPubkeyHex,
        props.targetKind,
        props.content,
        props.createdAt,
      ),
    );
  }
}

export type ReactionSummary = {
  readonly targetEventId: string;
  readonly likeCount: number;
  readonly likedByMe: boolean;
  readonly myReactionId?: string;
};

export function emptyReactionSummary(targetEventId: string): ReactionSummary {
  return {
    targetEventId: targetEventId.trim().toLowerCase(),
    likeCount: 0,
    likedByMe: false,
  };
}

/**
 * Aggregates like reactions for one target event.
 * Dedupes by reactor pubkey (latest created_at wins, then lowest id).
 */
export function summarizeLikes(
  targetEventId: string,
  reactions: readonly Reaction[],
  viewerPubkeyHex: string | null,
): ReactionSummary {
  const target = targetEventId.trim().toLowerCase();
  const viewer = viewerPubkeyHex?.trim().toLowerCase() ?? null;

  const likesByAuthor = new Map<string, Reaction>();
  for (const reaction of reactions) {
    if (reaction.targetEventId !== target || !reaction.isLike) {
      continue;
    }
    const existing = likesByAuthor.get(reaction.authorPubkeyHex);
    if (existing === undefined) {
      likesByAuthor.set(reaction.authorPubkeyHex, reaction);
      continue;
    }
    if (reaction.createdAt > existing.createdAt) {
      likesByAuthor.set(reaction.authorPubkeyHex, reaction);
      continue;
    }
    if (reaction.createdAt === existing.createdAt && reaction.id < existing.id) {
      likesByAuthor.set(reaction.authorPubkeyHex, reaction);
    }
  }

  let myReactionId: string | undefined;
  if (viewer !== null) {
    const mine = likesByAuthor.get(viewer);
    if (mine !== undefined) {
      myReactionId = mine.id;
    }
  }

  return {
    targetEventId: target,
    likeCount: likesByAuthor.size,
    likedByMe: myReactionId !== undefined,
    ...(myReactionId !== undefined ? {myReactionId} : {}),
  };
}
