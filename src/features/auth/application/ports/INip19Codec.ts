import type {Result} from '../../../../core/result/Result';
import type {
  InvalidNsecError,
  InvalidPublicKeyError,
  Nip19DecodeError,
} from '../../domain/errors';

export type Nip19ProfilePointer = {
  readonly pubkey: string;
  readonly relays?: readonly string[];
};

export type Nip19EventPointer = {
  readonly id: string;
  readonly relays?: readonly string[];
  readonly author?: string;
  readonly kind?: number;
};

export type Nip19AddressPointer = {
  readonly identifier: string;
  readonly pubkey: string;
  readonly kind: number;
  readonly relays?: readonly string[];
};

export type Nip19Decoded =
  | {readonly type: 'npub'; readonly data: string}
  | {readonly type: 'nsec'; readonly data: Uint8Array}
  | {readonly type: 'note'; readonly data: string}
  | {readonly type: 'nevent'; readonly data: Nip19EventPointer}
  | {readonly type: 'nprofile'; readonly data: Nip19ProfilePointer}
  | {readonly type: 'naddr'; readonly data: Nip19AddressPointer};

export interface INip19Codec {
  encodeNpub(pubkeyHex: string): Result<string, InvalidPublicKeyError>;
  encodeNsec(secretKey: Uint8Array): Result<string, InvalidNsecError>;
  encodeNote(eventIdHex: string): Result<string, Nip19DecodeError>;
  encodeNprofile(pointer: Nip19ProfilePointer): Result<string, Nip19DecodeError>;
  encodeNevent(pointer: Nip19EventPointer): Result<string, Nip19DecodeError>;
  encodeNaddr(pointer: Nip19AddressPointer): Result<string, Nip19DecodeError>;
  decode(bech32: string): Result<Nip19Decoded, Nip19DecodeError>;
}
