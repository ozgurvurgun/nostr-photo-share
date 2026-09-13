import {SignerUnavailableError} from '../../../core/errors/errors';
import {err, ok, type Result} from '../../../core/result/Result';
import type {ISigner} from '../../auth/application/ports/ISigner';
import type {ProfilePublishError} from '../domain/errors';
import {Nip05Identifier} from '../domain/Nip05Identifier';
import {
  withNip05Status,
  type Nip05Status,
  type Profile,
  type ProfileUpdateInput,
} from '../domain/Profile';
import type {INip05Verifier} from './ports/INip05Verifier';
import type {IProfileCache} from './ports/IProfileCache';
import type {IProfileRepository} from './ports/IProfileRepository';
import {profileFromUpdateInput, profileUpdateToKind0Content} from './profileContent';

export type UpdateProfileError = SignerUnavailableError | ProfilePublishError;

/**
 * Signs and publishes kind:0, then updates the in-memory profile cache.
 * Presentation owns TanStack Query invalidation on success.
 */
export class UpdateProfileUseCase {
  constructor(
    private readonly repository: IProfileRepository,
    private readonly cache: IProfileCache,
    private readonly nip05Verifier: INip05Verifier,
    private readonly getSigner: () => ISigner | null,
  ) {}

  async execute(input: ProfileUpdateInput): Promise<Result<Profile, UpdateProfileError>> {
    const signer = this.getSigner();
    if (signer === null) {
      return err(new SignerUnavailableError('No signer available to update profile'));
    }

    const pubkeyResult = await signer.getPublicKey();
    if (!pubkeyResult.ok) {
      return pubkeyResult;
    }
    const pubkeyHex = pubkeyResult.value.trim().toLowerCase();

    const content = profileUpdateToKind0Content(input);
    const signed = await signer.signEvent({
      kind: 0,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content,
    });
    if (!signed.ok) {
      return signed;
    }

    const publishResult = await this.repository.publish(signed.value);
    if (!publishResult.ok) {
      return publishResult;
    }

    let profile = profileFromUpdateInput(pubkeyHex, input, {
      eventId: signed.value.id,
      createdAt: signed.value.created_at,
    });
    profile = await this.attachNip05Status(profile, input.nip05, pubkeyHex);
    this.cache.set(pubkeyHex, profile);
    return ok(profile);
  }

  private async attachNip05Status(
    profile: Profile,
    nip05Raw: string,
    pubkeyHex: string,
  ): Promise<Profile> {
    const trimmed = nip05Raw.trim();
    if (trimmed.length === 0) {
      return withNip05Status(profile, 'none');
    }

    const parsed = Nip05Identifier.parse(trimmed);
    if (!parsed.ok) {
      return withNip05Status({...profile, nip05: trimmed}, 'failed');
    }

    const verification = await this.nip05Verifier.verify(parsed.value, pubkeyHex);
    const status: Nip05Status = verification.status === 'verified' ? 'verified' : 'failed';
    return withNip05Status(profile, status);
  }
}
