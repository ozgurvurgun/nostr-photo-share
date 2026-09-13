import {SignerUnavailableError} from '../../../core/errors/errors';
import {err, ok, type Result} from '../../../core/result/Result';
import type {ISigner} from '../../auth/application/ports/ISigner';
import {FollowList} from '../domain/FollowList';
import {InvalidFollowListError, SocialFetchError, SocialPublishError} from '../domain/errors';
import {buildKind3UnsignedEvent} from './kind3Draft';
import type {IFollowCache} from './ports/IFollowCache';
import type {ISocialRepository} from './ports/ISocialRepository';

export type UnfollowUserError =
  | SignerUnavailableError
  | InvalidFollowListError
  | SocialFetchError
  | SocialPublishError;

/**
 * Removes a pubkey from the viewer's NIP-02 contact list and republishes kind:3.
 */
export class UnfollowUserUseCase {
  constructor(
    private readonly repository: ISocialRepository,
    private readonly cache: IFollowCache,
    private readonly getSigner: () => ISigner | null,
  ) {}

  async execute(targetPubkeyHex: string): Promise<Result<FollowList, UnfollowUserError>> {
    const signer = this.getSigner();
    if (signer === null) {
      return err(new SignerUnavailableError('No signer available to unfollow user'));
    }

    const pubkeyResult = await signer.getPublicKey();
    if (!pubkeyResult.ok) {
      return pubkeyResult;
    }
    const ownerPubkeyHex = pubkeyResult.value.trim().toLowerCase();
    const target = targetPubkeyHex.trim().toLowerCase();

    const currentResult = await this.resolveCurrentList(ownerPubkeyHex);
    if (!currentResult.ok) {
      return currentResult;
    }
    const current = currentResult.value;

    if (!current.isFollowing(target)) {
      return ok(current);
    }

    const next = current.withoutFollow(target);
    if (!next.ok) {
      return next;
    }

    const draft = buildKind3UnsignedEvent({
      contacts: next.value.contacts,
      createdAt: Math.max(Math.floor(Date.now() / 1000), (current.createdAt ?? 0) + 1),
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

    const published = FollowList.create({
      ownerPubkeyHex,
      contacts: next.value.contacts,
      eventId: signed.value.id,
      createdAt: signed.value.created_at,
    });
    if (!published.ok) {
      return published;
    }

    this.cache.set(ownerPubkeyHex, published.value);
    return ok(published.value);
  }

  private async resolveCurrentList(
    ownerPubkeyHex: string,
  ): Promise<Result<FollowList, SocialFetchError | InvalidFollowListError>> {
    // Prefer a fresh kind:3 before mutate so we do not wipe a newer remote list.
    const fetchResult = await this.repository.fetchFollowList(ownerPubkeyHex);
    if (fetchResult.ok) {
      this.cache.set(ownerPubkeyHex, fetchResult.value);
      return ok(fetchResult.value);
    }
    const cached = this.cache.get(ownerPubkeyHex)?.list;
    if (cached !== undefined) {
      return ok(cached);
    }
    return fetchResult;
  }
}
