import type {SignerUnavailableError} from '../../../../core/errors/errors';
import type {Result} from '../../../../core/result/Result';

/** Application-facing signable event (NIP-01 fields without requiring infra imports). */
export type SignableEvent = {
  readonly kind: number;
  readonly created_at: number;
  readonly tags: readonly (readonly string[])[];
  readonly content: string;
  readonly pubkey?: string;
};

export type SignedEvent = {
  readonly id: string;
  readonly pubkey: string;
  readonly created_at: number;
  readonly kind: number;
  readonly tags: readonly (readonly string[])[];
  readonly content: string;
  readonly sig: string;
};

export interface ISigner {
  getPublicKey(): Promise<Result<string, SignerUnavailableError>>;
  signEvent(event: SignableEvent): Promise<Result<SignedEvent, SignerUnavailableError>>;
}
