import type {RelayList} from '../domain/RelayList';
import type {CachedRelayList, IRelayListCache} from '../application/ports/IRelayListCache';

export class InMemoryRelayListCache implements IRelayListCache {
  private readonly entries = new Map<string, CachedRelayList>();

  get(ownerPubkeyHex: string): CachedRelayList | null {
    return this.entries.get(ownerPubkeyHex.trim().toLowerCase()) ?? null;
  }

  set(ownerPubkeyHex: string, list: RelayList): void {
    const key = ownerPubkeyHex.trim().toLowerCase();
    this.entries.set(key, {
      list,
      fetchedAt: Date.now(),
    });
  }

  clear(): void {
    this.entries.clear();
  }
}
