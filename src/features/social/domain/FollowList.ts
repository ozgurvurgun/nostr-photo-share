import {err, ok, type Result} from '../../../core/result/Result';
import {InvalidFollowListError} from './errors';

export type ContactEntry = {
  readonly pubkeyHex: string;
  readonly relayUrl?: string;
  readonly petname?: string;
};

export type FollowListProps = {
  readonly ownerPubkeyHex: string;
  readonly contacts: readonly ContactEntry[];
  readonly eventId: string | null;
  readonly createdAt: number | null;
};

/**
 * NIP-02 kind:3 replaceable contact list for one owner.
 * Order is significant: new follows are appended at the end.
 */
export class FollowList {
  private constructor(
    readonly ownerPubkeyHex: string,
    readonly contacts: readonly ContactEntry[],
    readonly eventId: string | null,
    readonly createdAt: number | null,
  ) {}

  static create(props: FollowListProps): Result<FollowList, InvalidFollowListError> {
    const ownerPubkeyHex = props.ownerPubkeyHex.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(ownerPubkeyHex)) {
      return err(new InvalidFollowListError('Owner pubkey must be 64 hex characters'));
    }

    const normalized: ContactEntry[] = [];
    const seen = new Set<string>();
    for (const contact of props.contacts) {
      const pubkeyHex = contact.pubkeyHex.trim().toLowerCase();
      if (!/^[0-9a-f]{64}$/.test(pubkeyHex)) {
        return err(new InvalidFollowListError('Contact pubkey must be 64 hex characters'));
      }
      if (seen.has(pubkeyHex)) {
        continue;
      }
      seen.add(pubkeyHex);
      const relayUrl = contact.relayUrl?.trim();
      const petname = contact.petname?.trim();
      normalized.push({
        pubkeyHex,
        ...(relayUrl && relayUrl.length > 0 ? {relayUrl} : {}),
        ...(petname && petname.length > 0 ? {petname} : {}),
      });
    }

    const eventId =
      props.eventId === null || props.eventId === undefined
        ? null
        : props.eventId.trim().toLowerCase();
    if (eventId !== null && !/^[0-9a-f]{64}$/.test(eventId)) {
      return err(new InvalidFollowListError('Event id must be 64 hex characters'));
    }

    return ok(
      new FollowList(ownerPubkeyHex, normalized, eventId, props.createdAt ?? null),
    );
  }

  static empty(ownerPubkeyHex: string): Result<FollowList, InvalidFollowListError> {
    return FollowList.create({
      ownerPubkeyHex,
      contacts: [],
      eventId: null,
      createdAt: null,
    });
  }

  isFollowing(pubkeyHex: string): boolean {
    const target = pubkeyHex.trim().toLowerCase();
    return this.contacts.some(contact => contact.pubkeyHex === target);
  }

  followedPubkeys(): readonly string[] {
    return this.contacts.map(contact => contact.pubkeyHex);
  }

  withFollow(entry: ContactEntry): Result<FollowList, InvalidFollowListError> {
    const pubkeyHex = entry.pubkeyHex.trim().toLowerCase();
    if (this.isFollowing(pubkeyHex)) {
      return ok(this);
    }
    return FollowList.create({
      ownerPubkeyHex: this.ownerPubkeyHex,
      contacts: [...this.contacts, entry],
      eventId: this.eventId,
      createdAt: this.createdAt,
    });
  }

  withoutFollow(pubkeyHex: string): Result<FollowList, InvalidFollowListError> {
    const target = pubkeyHex.trim().toLowerCase();
    return FollowList.create({
      ownerPubkeyHex: this.ownerPubkeyHex,
      contacts: this.contacts.filter(contact => contact.pubkeyHex !== target),
      eventId: this.eventId,
      createdAt: this.createdAt,
    });
  }
}
