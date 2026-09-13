import {ok, type Result} from '../../../core/result/Result';
import type {ProfileFetchError} from '../domain/errors';
import {Nip05Identifier} from '../domain/Nip05Identifier';
import {
  isProfileContentEmpty,
  withNip05Status,
  type Nip05Status,
  type Profile,
} from '../domain/Profile';
import type {INip05Verifier} from './ports/INip05Verifier';
import type {IProfileCache} from './ports/IProfileCache';
import type {IProfileRepository} from './ports/IProfileRepository';

export class GetProfileUseCase {
  constructor(
    private readonly repository: IProfileRepository,
    private readonly cache: IProfileCache,
    private readonly nip05Verifier: INip05Verifier,
  ) {}

  async execute(pubkeyHex: string): Promise<Result<Profile, ProfileFetchError>> {
    const normalized = pubkeyHex.trim().toLowerCase();
    const cached = this.cache.get(normalized);

    const fetchResult = await this.repository.fetchByPubkey(normalized);
    if (!fetchResult.ok) {
      if (cached !== null) {
        return ok(cached.profile);
      }
      return fetchResult;
    }

    let profile = fetchResult.value;

    // Empty/timeout-style fetches must not wipe a richer cached profile.
    if (
      isProfileContentEmpty(profile) &&
      cached !== null &&
      !isProfileContentEmpty(cached.profile)
    ) {
      return ok(cached.profile);
    }

    profile = await this.attachNip05Status(profile);
    this.cache.set(normalized, profile);
    return ok(profile);
  }

  /** Prefer cached profile when present (offline-friendly UI helper). */
  getCached(pubkeyHex: string): Profile | null {
    return this.cache.get(pubkeyHex.trim().toLowerCase())?.profile ?? null;
  }

  private async attachNip05Status(profile: Profile): Promise<Profile> {
    if (profile.nip05 === null || profile.nip05.trim().length === 0) {
      return withNip05Status(profile, 'none');
    }

    const parsed = Nip05Identifier.parse(profile.nip05);
    if (!parsed.ok) {
      return withNip05Status(profile, 'failed');
    }

    const verification = await this.nip05Verifier.verify(parsed.value, profile.pubkeyHex);
    const status: Nip05Status = verification.status === 'verified' ? 'verified' : 'failed';
    return withNip05Status(profile, status);
  }
}
