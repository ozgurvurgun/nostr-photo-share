import type {FollowList} from '../domain/FollowList';
import type {CachedFollowList, IFollowCache} from '../application/ports/IFollowCache';

export class InMemoryFollowCache implements IFollowCache {
  private readonly entries = new Map<string, CachedFollowList>();

  get(ownerPubkeyHex: string): CachedFollowList | null {
    return this.entries.get(ownerPubkeyHex.trim().toLowerCase()) ?? null;
  }

  set(ownerPubkeyHex: string, list: FollowList): void {
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
