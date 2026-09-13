export interface IKeyGenerator {
  generateSecretKey(): Uint8Array;
  getPublicKeyHex(secretKey: Uint8Array): string;
}
