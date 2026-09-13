import type {
  INip05Verifier,
  Nip05VerificationResult,
} from '../application/ports/INip05Verifier';
import type {Nip05Identifier} from '../domain/Nip05Identifier';

export type FetchLike = (
  input: string,
  init?: {
    readonly redirect?: 'manual' | 'error' | 'follow';
    readonly headers?: Record<string, string>;
    readonly signal?: AbortSignal;
  },
) => Promise<Response>;

function isRedirectStatus(status: number): boolean {
  return status >= 300 && status < 400;
}

/**
 * NIP-05 verification via HTTPS well-known document.
 * MUST NOT follow HTTP redirects (identification only, not auth).
 */
export class FetchNip05Verifier implements INip05Verifier {
  constructor(
    private readonly fetchFn: FetchLike = fetch.bind(globalThis),
    private readonly timeoutMs: number = 8_000,
  ) {}

  async verify(
    identifier: Nip05Identifier,
    expectedPubkeyHex: string,
  ): Promise<Nip05VerificationResult> {
    const url = identifier.wellKnownUrl();
    const expected = expectedPubkeyHex.trim().toLowerCase();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchFn(url, {
        redirect: 'manual',
        headers: {Accept: 'application/json'},
        signal: controller.signal,
      });

      if (response.type === 'opaqueredirect' || isRedirectStatus(response.status)) {
        return {status: 'failed', reason: 'redirect'};
      }

      if (!response.ok) {
        return {status: 'failed', reason: 'http'};
      }

      const body: unknown = await response.json();
      if (typeof body !== 'object' || body === null) {
        return {status: 'failed', reason: 'invalid'};
      }

      const names = (body as {names?: unknown}).names;
      if (typeof names !== 'object' || names === null) {
        return {status: 'failed', reason: 'missing'};
      }

      const found = (names as Record<string, unknown>)[identifier.local];
      if (typeof found !== 'string') {
        return {status: 'failed', reason: 'missing'};
      }

      if (found.trim().toLowerCase() !== expected) {
        return {status: 'failed', reason: 'mismatch'};
      }

      return {status: 'verified'};
    } catch {
      return {status: 'failed', reason: 'network'};
    } finally {
      clearTimeout(timer);
    }
  }
}
