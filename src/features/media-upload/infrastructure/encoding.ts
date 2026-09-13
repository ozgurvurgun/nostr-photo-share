const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64URL_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function encodeWithAlphabet(bytes: Uint8Array, alphabet: string, pad: boolean): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i] ?? 0;
    const b1 = i + 1 < bytes.length ? (bytes[i + 1] ?? 0) : 0;
    const b2 = i + 2 < bytes.length ? (bytes[i + 2] ?? 0) : 0;
    const triplet = (b0 << 16) | (b1 << 8) | b2;

    const remaining = bytes.length - i;
    out += alphabet[(triplet >> 18) & 63];
    out += alphabet[(triplet >> 12) & 63];
    if (remaining > 1) {
      out += alphabet[(triplet >> 6) & 63];
    } else if (pad) {
      out += '=';
    }
    if (remaining > 2) {
      out += alphabet[triplet & 63];
    } else if (pad) {
      out += '=';
    }
  }
  return out;
}

/** UTF-8 encode without relying on global TextEncoder (RN / Jest). */
function utf8Bytes(text: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i += 1) {
    let code = text.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
        i += 1;
      }
    }
    if (code <= 0x7f) {
      bytes.push(code);
    } else if (code <= 0x7ff) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code <= 0xffff) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }
  return Uint8Array.from(bytes);
}

/** Standard Base64 with padding (NIP-98). */
export function encodeBase64(text: string): string {
  return encodeWithAlphabet(utf8Bytes(text), BASE64_ALPHABET, true);
}

/** Base64url without padding (Blossom BUD-11). */
export function encodeBase64UrlNoPad(text: string): string {
  return encodeWithAlphabet(utf8Bytes(text), BASE64URL_ALPHABET, false);
}

/** Compact JSON for signed Nostr events used in Authorization headers. */
export function signedEventToJson(event: {
  readonly id: string;
  readonly pubkey: string;
  readonly created_at: number;
  readonly kind: number;
  readonly tags: readonly (readonly string[])[];
  readonly content: string;
  readonly sig: string;
}): string {
  return JSON.stringify({
    id: event.id,
    pubkey: event.pubkey,
    created_at: event.created_at,
    kind: event.kind,
    tags: event.tags.map(t => [...t]),
    content: event.content,
    sig: event.sig,
  });
}
