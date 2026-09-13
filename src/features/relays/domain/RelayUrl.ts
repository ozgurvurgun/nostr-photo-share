import {err, ok, type Result} from '../../../core/result/Result';
import {InvalidRelayUrlError} from './errors';

/**
 * Normalizes a relay URL for NIP-65 storage and pool use.
 * Trims, ensures ws(s), lowercases host, strips a trailing slash on the path.
 */
export function normalizeRelayUrl(raw: string): Result<string, InvalidRelayUrlError> {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return err(new InvalidRelayUrlError('Relay URL is empty'));
  }

  let candidate = trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(candidate)) {
    candidate = `wss://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch (cause) {
    return err(new InvalidRelayUrlError('Relay URL could not be parsed', {cause}));
  }

  let protocol = parsed.protocol;
  if (protocol === 'http:') {
    protocol = 'ws:';
  } else if (protocol === 'https:') {
    protocol = 'wss:';
  }

  if (protocol !== 'ws:' && protocol !== 'wss:') {
    return err(new InvalidRelayUrlError('Relay URL must use ws:// or wss://'));
  }

  const hostname = parsed.hostname.toLowerCase();
  let pathname = parsed.pathname.replace(/\/+/g, '/');
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }
  if (pathname === '/') {
    pathname = '';
  }

  let port = parsed.port;
  if (
    (port === '80' && protocol === 'ws:') ||
    (port === '443' && protocol === 'wss:')
  ) {
    port = '';
  }

  const auth =
    parsed.username.length > 0
      ? `${parsed.username}${parsed.password ? `:${parsed.password}` : ''}@`
      : '';
  // Do not persist credentials in normalized relay URLs (NIP-65 / pool / logs).
  void auth;
  const host = port.length > 0 ? `${hostname}:${port}` : hostname;
  const search = parsed.search;
  const normalized = `${protocol}//${host}${pathname}${search}`;

  if (normalized.length === 0) {
    return err(new InvalidRelayUrlError('Relay URL is empty after normalization'));
  }

  return ok(normalized);
}

export type RelayUrl = string & {readonly __brand: 'RelayUrl'};

export function asRelayUrl(raw: string): Result<RelayUrl, InvalidRelayUrlError> {
  const normalized = normalizeRelayUrl(raw);
  if (!normalized.ok) {
    return normalized;
  }
  return ok(normalized.value as RelayUrl);
}
