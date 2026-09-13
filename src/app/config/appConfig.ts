import {DEFAULT_RELAYS} from './relays';
import {
  DEFAULT_MAX_IMAGE_BYTES,
  DEFAULT_MAX_IMAGE_DIMENSION,
} from '../../features/media-upload/domain/ImageConstraints';

export const APP_NAME = 'Still';

/**
 * Public Blossom CDN hosts (BUD-02 compatible).
 * `blossom.primal.net` is a well-known public Blossom server used by Primal;
 * alternatives if unhealthy: https://cdn.nostrcheck.me , https://blossom.band
 */
export const DEFAULT_BLOSSOM_SERVERS = ['https://blossom.primal.net'] as const;

export const appConfig = {
  name: APP_NAME,
  defaultRelays: DEFAULT_RELAYS,
  relayConnectTimeoutMs: 8_000,
  relayPublishTimeoutMs: 8_000,
  relayReconnectDelayMs: 1_000,
  profileQueryTimeoutMs: 8_000,
  feedQueryTimeoutMs: 8_000,
  feedPageSize: 20,
  blossomServers: DEFAULT_BLOSSOM_SERVERS,
  /** Optional NIP-96 servers (unrecommended; empty by default). */
  nip96Servers: [] as readonly string[],
  /** Prefer Blossom; when nip96Servers is non-empty, CompositeMediaUploader may fall back. */
  preferBlossom: true,
  enableNip96Fallback: false,
  maxImageBytes: DEFAULT_MAX_IMAGE_BYTES,
  maxImageDimension: DEFAULT_MAX_IMAGE_DIMENSION,
} as const;

export type AppConfig = {
  readonly name: string;
  readonly defaultRelays: readonly string[];
  readonly relayConnectTimeoutMs: number;
  readonly relayPublishTimeoutMs: number;
  readonly relayReconnectDelayMs: number;
  readonly profileQueryTimeoutMs: number;
  readonly feedQueryTimeoutMs: number;
  readonly feedPageSize: number;
  readonly blossomServers: readonly string[];
  readonly nip96Servers: readonly string[];
  readonly preferBlossom: boolean;
  readonly enableNip96Fallback: boolean;
  readonly maxImageBytes: number;
  readonly maxImageDimension: number;
};
