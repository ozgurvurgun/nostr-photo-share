export interface IBlobHasher {
  sha256Hex(bytes: Uint8Array): string;
}
