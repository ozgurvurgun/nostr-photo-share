import type {AuthMethod} from './AuthMethod';
import type {PublicKey} from './PublicKey';

export type NostrIdentity = {
  readonly publicKey: PublicKey;
  readonly authMethod: AuthMethod;
};

export function createNostrIdentity(
  publicKey: PublicKey,
  authMethod: AuthMethod,
): NostrIdentity {
  return {publicKey, authMethod};
}
