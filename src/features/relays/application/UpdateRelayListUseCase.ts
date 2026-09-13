import {SignerUnavailableError} from '../../../core/errors/errors';
import {err, ok, type Result} from '../../../core/result/Result';
import type {ISigner} from '../../auth/application/ports/ISigner';
import {RelayList} from '../domain/RelayList';
import type {RelayPreference} from '../domain/RelayPreference';
import {
  InvalidRelayListError,
  RelayListFetchError,
  RelayListPublishError,
} from '../domain/errors';
import {buildKind10002UnsignedEvent} from './kind10002Draft';
import type {ApplyRelayListToPoolUseCase} from './ApplyRelayListToPoolUseCase';
import type {IRelayListCache} from './ports/IRelayListCache';
import type {IRelayListRepository} from './ports/IRelayListRepository';

export type UpdateRelayListError =
  | SignerUnavailableError
  | InvalidRelayListError
  | RelayListFetchError
  | RelayListPublishError;

export type UpdateRelayListInput = {
  readonly preferences: readonly RelayPreference[];
};

/**
 * Validates preferences, publishes kind:10002 with created_at freshness,
 * syncs the pool, and updates cache.
 * Publishes to union(old write URLs, new preference URLs) so new write relays receive the list.
 */
export class UpdateRelayListUseCase {
  constructor(
    private readonly repository: IRelayListRepository,
    private readonly cache: IRelayListCache,
    private readonly applyToPool: ApplyRelayListToPoolUseCase,
    private readonly getSigner: () => ISigner | null,
  ) {}

  async execute(
    input: UpdateRelayListInput,
  ): Promise<Result<RelayList, UpdateRelayListError>> {
    const signer = this.getSigner();
    if (signer === null) {
      return err(new SignerUnavailableError('No signer available to update relay list'));
    }

    const pubkeyResult = await signer.getPublicKey();
    if (!pubkeyResult.ok) {
      return pubkeyResult;
    }
    const ownerPubkeyHex = pubkeyResult.value.trim().toLowerCase();

    const previous = this.cache.get(ownerPubkeyHex)?.list ?? null;
    const previousCreatedAt =
      previous?.createdAt ?? (await this.peekRemoteCreatedAt(ownerPubkeyHex));

    const next = RelayList.create({
      ownerPubkeyHex,
      preferences: input.preferences,
      eventId: null,
      createdAt: null,
    });
    if (!next.ok) {
      return next;
    }

    if (next.value.preferences.length === 0) {
      return err(new InvalidRelayListError('Add at least one relay before saving'));
    }

    const draft = buildKind10002UnsignedEvent({
      preferences: next.value.preferences,
      createdAt: Math.max(
        Math.floor(Date.now() / 1000),
        (previousCreatedAt ?? 0) + 1,
      ),
    });
    const signed = await signer.signEvent(draft);
    if (!signed.ok) {
      return signed;
    }

    const publishTargets = [
      ...new Set([
        ...(previous?.writeUrls() ?? []),
        ...next.value.allUrls(),
      ]),
    ];

    const publishResult = await this.repository.publish(
      {
        id: signed.value.id,
        pubkey: signed.value.pubkey,
        created_at: signed.value.created_at,
        kind: signed.value.kind,
        tags: signed.value.tags,
        content: signed.value.content,
        sig: signed.value.sig,
      },
      publishTargets,
    );
    if (!publishResult.ok) {
      return publishResult;
    }

    const published = RelayList.create({
      ownerPubkeyHex,
      preferences: next.value.preferences,
      eventId: signed.value.id,
      createdAt: signed.value.created_at,
    });
    if (!published.ok) {
      return published;
    }

    await this.applyToPool.execute(published.value);
    this.cache.set(ownerPubkeyHex, published.value);
    return ok(published.value);
  }

  private async peekRemoteCreatedAt(ownerPubkeyHex: string): Promise<number | null> {
    const fetchResult = await this.repository.fetchRelayList(ownerPubkeyHex);
    if (!fetchResult.ok) {
      return null;
    }
    return fetchResult.value.createdAt;
  }
}
