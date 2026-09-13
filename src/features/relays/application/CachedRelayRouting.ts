import type {IRelayListCache} from './ports/IRelayListCache';
import type {IRelayRouting} from './ports/IRelayRouting';

/**
 * Resolves write relays from the cached NIP-65 list for the current user.
 * - `null` - no routing configured (no cache) -> publish to all wanted pool relays
 * - `[]` - list known but no write relays -> publish must not fall through to all relays
 * - non-empty - publish only to these write URLs
 */
export class CachedRelayRouting implements IRelayRouting {
  constructor(
    private readonly cache: IRelayListCache,
    private readonly getOwnerPubkeyHex: () => string | null,
  ) {}

  getWriteRelayUrls(): readonly string[] | null {
    const owner = this.getOwnerPubkeyHex();
    if (owner === null || owner.trim().length === 0) {
      return null;
    }
    const cached = this.cache.get(owner.trim().toLowerCase());
    if (cached === null) {
      return null;
    }
    return cached.list.writeUrls();
  }
}
