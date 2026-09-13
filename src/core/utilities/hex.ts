const HEX64 = /^[0-9a-f]{64}$/;
const HEX128 = /^[0-9a-f]{128}$/;
const HEX_CHAR = /^[0-9a-f]+$/;

export function isHex64(value: string): boolean {
  return HEX64.test(value);
}

export function isHex128(value: string): boolean {
  return HEX128.test(value);
}

export function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) {
    out += (bytes[i] ?? 0).toString(16).padStart(2, '0');
  }
  return out;
}

export function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.trim().toLowerCase();
  if (normalized.length % 2 !== 0 || !HEX_CHAR.test(normalized)) {
    throw new Error('Invalid hex string');
  }
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** Best-effort wipe of secret material held in a mutable byte buffer. */
export function wipeBytes(bytes: Uint8Array): void {
  bytes.fill(0);
}
