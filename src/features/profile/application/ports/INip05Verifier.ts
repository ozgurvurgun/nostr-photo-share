import type {Nip05Identifier} from '../../domain/Nip05Identifier';

export type Nip05VerificationStatus = 'verified' | 'failed';

export type Nip05VerificationResult = {
  readonly status: Nip05VerificationStatus;
  readonly reason?: 'mismatch' | 'redirect' | 'network' | 'http' | 'missing' | 'invalid';
};

export interface INip05Verifier {
  verify(
    identifier: Nip05Identifier,
    expectedPubkeyHex: string,
  ): Promise<Nip05VerificationResult>;
}
