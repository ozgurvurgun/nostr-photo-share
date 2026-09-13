import {bytesToHex, wipeBytes} from '../../../core/utilities/hex';
import {err, ok, type Result} from '../../../core/result/Result';
import type {ISigner} from './ports/ISigner';
import {createNostrIdentity, type NostrIdentity} from '../domain/NostrIdentity';
import {PublicKey} from '../domain/PublicKey';
import {
  InvalidNsecError,
  type IdentityStorageError,
  type InvalidPublicKeyError,
  type Nip19DecodeError,
} from '../domain/errors';
import type {AuthRuntime} from './AuthRuntime';
import type {IIdentitySessionStore} from './ports/IIdentitySessionStore';
import type {IKeyGenerator} from './ports/IKeyGenerator';
import type {INip19Codec} from './ports/INip19Codec';

export type ImportNsecError =
  | InvalidNsecError
  | InvalidPublicKeyError
  | Nip19DecodeError
  | IdentityStorageError;

export class ImportNsecUseCase {
  constructor(
    private readonly store: IIdentitySessionStore,
    private readonly nip19: INip19Codec,
    private readonly keyGenerator: IKeyGenerator,
    private readonly authRuntime: AuthRuntime,
    private readonly createLocalSigner: () => ISigner,
  ) {}

  async execute(nsecInput: string): Promise<Result<NostrIdentity, ImportNsecError>> {
    const trimmed = nsecInput.trim();
    const decoded = this.nip19.decode(trimmed);
    if (!decoded.ok) {
      return err(new InvalidNsecError('Invalid nsec'));
    }
    if (decoded.value.type !== 'nsec') {
      return err(new InvalidNsecError('Expected an nsec identifier'));
    }

    const secretKey = decoded.value.data;
    try {
      let pubkeyHex: string;
      try {
        pubkeyHex = this.keyGenerator.getPublicKeyHex(secretKey);
      } catch {
        return err(new InvalidNsecError('Invalid nsec'));
      }

      const publicKeyResult = PublicKey.fromHex(pubkeyHex);
      if (!publicKeyResult.ok) {
        return publicKeyResult;
      }

      const saveSecret = await this.store.saveSecretKeyHex(bytesToHex(secretKey));
      if (!saveSecret.ok) {
        return saveSecret;
      }

      const identity = createNostrIdentity(publicKeyResult.value, 'imported');
      const saveSession = await this.store.saveSession({
        authMethod: identity.authMethod,
        pubkeyHex: identity.publicKey.toHex(),
        bunkerPointer: null,
      });
      if (!saveSession.ok) {
        await this.store.clear();
        return saveSession;
      }

      this.authRuntime.setSession({
        identity,
        signer: this.createLocalSigner(),
      });

      return ok(identity);
    } finally {
      wipeBytes(secretKey);
    }
  }
}
