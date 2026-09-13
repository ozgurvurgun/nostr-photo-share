import {
  decode,
  naddrEncode,
  neventEncode,
  noteEncode,
  npubEncode,
  nprofileEncode,
  nsecEncode,
} from 'nostr-tools/nip19';
import {isHex64} from '../../../core/utilities/hex';
import {err, ok, type Result} from '../../../core/result/Result';
import type {
  INip19Codec,
  Nip19AddressPointer,
  Nip19Decoded,
  Nip19EventPointer,
  Nip19ProfilePointer,
} from '../application/ports/INip19Codec';
import {
  InvalidNsecError,
  InvalidPublicKeyError,
  Nip19DecodeError,
} from '../domain/errors';

export class Nip19Codec implements INip19Codec {
  encodeNpub(pubkeyHex: string): Result<string, InvalidPublicKeyError> {
    const normalized = pubkeyHex.trim().toLowerCase();
    if (!isHex64(normalized)) {
      return err(new InvalidPublicKeyError());
    }
    try {
      return ok(npubEncode(normalized));
    } catch (cause) {
      return err(new InvalidPublicKeyError('Failed to encode npub', {cause}));
    }
  }

  encodeNsec(secretKey: Uint8Array): Result<string, InvalidNsecError> {
    if (secretKey.length !== 32) {
      return err(new InvalidNsecError('Secret key must be 32 bytes'));
    }
    try {
      return ok(nsecEncode(secretKey));
    } catch (cause) {
      return err(new InvalidNsecError('Failed to encode nsec', {cause}));
    }
  }

  encodeNote(eventIdHex: string): Result<string, Nip19DecodeError> {
    const normalized = eventIdHex.trim().toLowerCase();
    if (!isHex64(normalized)) {
      return err(new Nip19DecodeError('Invalid note id'));
    }
    try {
      return ok(noteEncode(normalized));
    } catch (cause) {
      return err(new Nip19DecodeError('Failed to encode note', {cause}));
    }
  }

  encodeNprofile(pointer: Nip19ProfilePointer): Result<string, Nip19DecodeError> {
    try {
      return ok(
        nprofileEncode({
          pubkey: pointer.pubkey,
          relays: pointer.relays ? [...pointer.relays] : undefined,
        }),
      );
    } catch (cause) {
      return err(new Nip19DecodeError('Failed to encode nprofile', {cause}));
    }
  }

  encodeNevent(pointer: Nip19EventPointer): Result<string, Nip19DecodeError> {
    try {
      return ok(
        neventEncode({
          id: pointer.id,
          relays: pointer.relays ? [...pointer.relays] : undefined,
          author: pointer.author,
          kind: pointer.kind,
        }),
      );
    } catch (cause) {
      return err(new Nip19DecodeError('Failed to encode nevent', {cause}));
    }
  }

  encodeNaddr(pointer: Nip19AddressPointer): Result<string, Nip19DecodeError> {
    try {
      return ok(
        naddrEncode({
          identifier: pointer.identifier,
          pubkey: pointer.pubkey,
          kind: pointer.kind,
          relays: pointer.relays ? [...pointer.relays] : undefined,
        }),
      );
    } catch (cause) {
      return err(new Nip19DecodeError('Failed to encode naddr', {cause}));
    }
  }

  decode(bech32: string): Result<Nip19Decoded, Nip19DecodeError> {
    try {
      const decoded = decode(bech32.trim());
      switch (decoded.type) {
        case 'npub':
          return ok({type: 'npub', data: decoded.data});
        case 'nsec':
          return ok({type: 'nsec', data: decoded.data});
        case 'note':
          return ok({type: 'note', data: decoded.data});
        case 'nevent':
          return ok({
            type: 'nevent',
            data: {
              id: decoded.data.id,
              relays: decoded.data.relays,
              author: decoded.data.author,
              kind: decoded.data.kind,
            },
          });
        case 'nprofile':
          return ok({
            type: 'nprofile',
            data: {
              pubkey: decoded.data.pubkey,
              relays: decoded.data.relays,
            },
          });
        case 'naddr':
          return ok({
            type: 'naddr',
            data: {
              identifier: decoded.data.identifier,
              pubkey: decoded.data.pubkey,
              kind: decoded.data.kind,
              relays: decoded.data.relays,
            },
          });
        default:
          return err(new Nip19DecodeError('Unsupported NIP-19 type'));
      }
    } catch (cause) {
      return err(new Nip19DecodeError('Invalid NIP-19 identifier', {cause}));
    }
  }
}
