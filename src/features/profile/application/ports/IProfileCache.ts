import type {Profile} from '../../domain/Profile';

export type CachedProfile = {
  readonly profile: Profile;
  readonly fetchedAt: number;
};

export interface IProfileCache {
  get(pubkeyHex: string): CachedProfile | null;
  set(pubkeyHex: string, profile: Profile): void;
  invalidate(pubkeyHex: string): void;
  clear(): void;
}
