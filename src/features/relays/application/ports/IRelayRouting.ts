/**
 * Optional write-relay routing for publish (NIP-65).
 * - null: no list configured → use all wanted pool relays
 * - []: list configured with zero write relays → do not publish to the pool
 * - non-empty: publish only to these URLs
 */
export interface IRelayRouting {
  getWriteRelayUrls(): readonly string[] | null;
}
