import type {Profile} from '../domain/Profile';
import type {CachedProfile, IProfileCache} from '../application/ports/IProfileCache';

export class InMemoryProfileCache implements IProfileCache {
  private readonly entries = new Map<string, CachedProfile>();

  get(pubkeyHex: string): CachedProfile | null {
    return this.entries.get(pubkeyHex.trim().toLowerCase()) ?? null;
  }

  set(pubkeyHex: string, profile: Profile): void {
    const key = pubkeyHex.trim().toLowerCase();
    this.entries.set(key, {
      profile: {...profile, pubkeyHex: key},
      fetchedAt: Date.now(),
    });
  }

  invalidate(pubkeyHex: string): void {
    this.entries.delete(pubkeyHex.trim().toLowerCase());
  }

  clear(): void {
    this.entries.clear();
  }
}
