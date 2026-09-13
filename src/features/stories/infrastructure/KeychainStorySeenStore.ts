import * as Keychain from 'react-native-keychain';
import type {IStorySeenStore} from '../application/ports/IStorySeenStore';

const SERVICE = 'com.still.app.stories.seen';
const USERNAME = 'stories.seen';

const KEYCHAIN_OPTIONS = {
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
} as const;

/**
 * Persists story seen ids in Keychain so rings stay accurate across restarts.
 * Memory is the source of truth after hydrate(); writes are best-effort async.
 */
export class KeychainStorySeenStore implements IStorySeenStore {
  private readonly seen = new Set<string>();
  private hydratePromise: Promise<void> | null = null;

  async hydrate(): Promise<void> {
    if (this.hydratePromise === null) {
      this.hydratePromise = this.loadFromKeychain();
    }
    await this.hydratePromise;
  }

  hasSeen(storyId: string): boolean {
    return this.seen.has(storyId.trim().toLowerCase());
  }

  markSeen(storyId: string): void {
    const normalized = storyId.trim().toLowerCase();
    if (normalized.length === 0 || this.seen.has(normalized)) {
      return;
    }
    this.seen.add(normalized);
    void this.persist();
  }

  getSeenIds(): ReadonlySet<string> {
    return new Set(this.seen);
  }

  clear(): void {
    this.seen.clear();
    void Keychain.resetGenericPassword({service: SERVICE}).catch(() => {
      // Best-effort clear on logout.
    });
  }

  private async loadFromKeychain(): Promise<void> {
    try {
      const credentials = await Keychain.getGenericPassword({service: SERVICE});
      if (credentials === false) {
        return;
      }
      const parsed = JSON.parse(credentials.password) as unknown;
      if (!Array.isArray(parsed)) {
        return;
      }
      for (const item of parsed) {
        if (typeof item === 'string') {
          const normalized = item.trim().toLowerCase();
          if (/^[0-9a-f]{64}$/.test(normalized)) {
            this.seen.add(normalized);
          }
        }
      }
    } catch {
      // Corrupt or unavailable storage — start empty.
    }
  }

  private async persist(): Promise<void> {
    try {
      await Keychain.setGenericPassword(USERNAME, JSON.stringify([...this.seen]), {
        service: SERVICE,
        ...KEYCHAIN_OPTIONS,
      });
    } catch {
      // Best-effort; in-memory state remains correct for this session.
    }
  }
}
