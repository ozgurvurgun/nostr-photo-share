import {sha256} from '@noble/hashes/sha2.js';
import {bytesToHex} from '../../../core/utilities/hex';
import type {IBlobHasher} from '../application/ports/IBlobHasher';

export class NobleBlobHasher implements IBlobHasher {
  sha256Hex(bytes: Uint8Array): string {
    return bytesToHex(sha256(bytes));
  }
}
