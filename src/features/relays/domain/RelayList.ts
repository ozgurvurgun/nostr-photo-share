import {err, ok, type Result} from '../../../core/result/Result';
import {MAX_RELAYS} from './constants';
import {InvalidRelayListError} from './errors';
import {normalizeRelayUrl} from './RelayUrl';
import type {RelayPreference} from './RelayPreference';

export type RelayListProps = {
  readonly ownerPubkeyHex: string;
  readonly preferences: readonly RelayPreference[];
  readonly eventId?: string | null;
  readonly createdAt?: number | null;
};

/**
 * NIP-65 kind:10002 replaceable relay list for one owner.
 * Write URLs power outbox discovery for followed authors.
 */
export class RelayList {
  private constructor(
    readonly ownerPubkeyHex: string,
    readonly preferences: readonly RelayPreference[],
    readonly eventId: string | null,
    readonly createdAt: number | null,
  ) {}

  static create(props: RelayListProps): Result<RelayList, InvalidRelayListError> {
    const ownerPubkeyHex = props.ownerPubkeyHex.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(ownerPubkeyHex)) {
      return err(new InvalidRelayListError('Owner pubkey must be 64 hex characters'));
    }

    const byUrl = new Map<string, RelayPreference>();
    for (const pref of props.preferences) {
      const urlResult = normalizeRelayUrl(pref.url);
      if (!urlResult.ok) {
        return err(new InvalidRelayListError(urlResult.error.message));
      }
      const url = urlResult.value;
      const read = pref.read === true;
      const write = pref.write === true;
      if (!read && !write) {
        return err(new InvalidRelayListError('Each relay must allow read and/or write'));
      }
      const existing = byUrl.get(url);
      if (existing !== undefined) {
        byUrl.set(url, {
          url,
          read: existing.read || read,
          write: existing.write || write,
        });
        continue;
      }
      byUrl.set(url, {url, read, write});
    }

    const preferences = [...byUrl.values()];
    if (preferences.length > MAX_RELAYS) {
      return err(
        new InvalidRelayListError(`Relay list may contain at most ${MAX_RELAYS} relays`),
      );
    }

    const eventId =
      props.eventId === null || props.eventId === undefined
        ? null
        : props.eventId.trim().toLowerCase();
    if (eventId !== null && !/^[0-9a-f]{64}$/.test(eventId)) {
      return err(new InvalidRelayListError('Event id must be 64 hex characters'));
    }

    return ok(
      new RelayList(ownerPubkeyHex, preferences, eventId, props.createdAt ?? null),
    );
  }

  /** Empty list (no preferences) for an owner — used before defaults are applied. */
  static empty(ownerPubkeyHex: string): Result<RelayList, InvalidRelayListError> {
    return RelayList.create({
      ownerPubkeyHex,
      preferences: [],
      eventId: null,
      createdAt: null,
    });
  }

  /**
   * Builds a local default list (both read+write) from configured relay URLs.
   */
  static fromDefaultUrls(
    ownerPubkeyHex: string,
    defaultUrls: readonly string[],
  ): Result<RelayList, InvalidRelayListError> {
    return RelayList.create({
      ownerPubkeyHex,
      preferences: defaultUrls.map(url => ({url, read: true, write: true})),
      eventId: null,
      createdAt: null,
    });
  }

  readUrls(): readonly string[] {
    return this.preferences.filter(p => p.read).map(p => p.url);
  }

  writeUrls(): readonly string[] {
    return this.preferences.filter(p => p.write).map(p => p.url);
  }

  /** All URLs that participate in read or write. */
  allUrls(): readonly string[] {
    return this.preferences.map(p => p.url);
  }
}
