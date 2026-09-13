import type {Result} from '../../../../core/result/Result';
import type {BunkerConnectionError} from '../../domain/errors';
import type {ISigner} from './ISigner';
import type {StoredBunkerPointer} from './IIdentitySessionStore';

export type BunkerConnectResult = {
  readonly remotePubkeyHex: string;
  readonly clientSecretKeyHex: string;
  readonly bunkerPointer: StoredBunkerPointer;
  readonly signer: ISigner;
  readonly close: () => Promise<void>;
};

export type BunkerConnectOptions = {
  readonly onAuthUrl?: (url: string) => void;
};

export interface IBunkerConnector {
  connect(
    uri: string,
    options?: BunkerConnectOptions,
  ): Promise<Result<BunkerConnectResult, BunkerConnectionError>>;
}
