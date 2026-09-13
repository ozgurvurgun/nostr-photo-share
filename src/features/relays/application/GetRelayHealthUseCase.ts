import type {RelayPreference} from '../domain/RelayPreference';
import type {IRelayListCache} from './ports/IRelayListCache';

export type RelayHealthSnapshot = {
  readonly url: string;
  readonly connected: boolean;
  readonly reconnecting: boolean;
};

export type RelayHealthWithPreference = RelayHealthSnapshot & {
  readonly read: boolean;
  readonly write: boolean;
  /** True when the URL is in the pool but not in the saved preference list. */
  readonly inPreferences: boolean;
};

export type RelayHealthSource = {
  getRelayHealth(): readonly RelayHealthSnapshot[];
};

/**
 * Merges pool connection health with cached NIP-65 read/write flags.
 */
export class GetRelayHealthUseCase {
  constructor(
    private readonly healthSource: RelayHealthSource,
    private readonly cache: IRelayListCache,
  ) {}

  execute(ownerPubkeyHex?: string): readonly RelayHealthWithPreference[] {
    const health = this.healthSource.getRelayHealth();
    const list =
      ownerPubkeyHex !== undefined && ownerPubkeyHex.trim().length > 0
        ? this.cache.get(ownerPubkeyHex.trim().toLowerCase())?.list ?? null
        : null;

    const prefByUrl = new Map<string, RelayPreference>();
    if (list !== null) {
      for (const pref of list.preferences) {
        prefByUrl.set(pref.url, pref);
      }
    }

    return health.map(entry => {
      const pref = prefByUrl.get(entry.url);
      if (pref === undefined) {
        return {
          ...entry,
          read: true,
          write: true,
          inPreferences: false,
        };
      }
      return {
        ...entry,
        read: pref.read,
        write: pref.write,
        inPreferences: true,
      };
    });
  }
}
