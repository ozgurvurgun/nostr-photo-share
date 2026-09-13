import {err, ok, type Result} from '../../../core/result/Result';
import type {NostrGateway} from '../../../infrastructure/nostr/gateway/NostrGateway';
import type {SignedNostrEvent} from '../../../infrastructure/nostr/protocol/event';
import type {IProfileRepository} from '../application/ports/IProfileRepository';
import {ProfileFetchError, ProfilePublishError} from '../domain/errors';
import {emptyProfile, type Profile} from '../domain/Profile';
import {Kind0ProfileMapper} from './Kind0ProfileMapper';

export class NostrProfileRepository implements IProfileRepository {
  constructor(
    private readonly gateway: NostrGateway,
    private readonly queryTimeoutMs: number,
  ) {}

  async fetchByPubkey(pubkeyHex: string): Promise<Result<Profile, ProfileFetchError>> {
    const normalized = pubkeyHex.trim().toLowerCase();
    try {
      const events = await this.gateway.query(
        [{kinds: [0], authors: [normalized], limit: 1}],
        {timeoutMs: this.queryTimeoutMs},
      );

      const kind0 = events.filter(
        event => event.kind === 0 && event.pubkey.trim().toLowerCase() === normalized,
      );
      const latest = Kind0ProfileMapper.pickLatestReplaceable(kind0);
      if (latest === null) {
        return ok(emptyProfile(normalized));
      }
      return ok(Kind0ProfileMapper.fromEvent(latest));
    } catch (cause) {
      return err(new ProfileFetchError('Failed to fetch profile from relays', {cause}));
    }
  }

  async publish(event: SignedNostrEvent): Promise<Result<void, ProfilePublishError>> {
    try {
      const results = await this.gateway.publish(event);
      if (results.some(result => result.accepted)) {
        return ok(undefined);
      }
      const message =
        results.find(result => result.message)?.message ?? 'No relay accepted the profile event';
      return err(new ProfilePublishError(message));
    } catch (cause) {
      return err(new ProfilePublishError('Failed to publish profile event', {cause}));
    }
  }
}
