import type {FollowList} from '../../domain/FollowList';

export type CachedFollowList = {
  readonly list: FollowList;
  readonly fetchedAt: number;
};

export interface IFollowCache {
  get(ownerPubkeyHex: string): CachedFollowList | null;
  set(ownerPubkeyHex: string, list: FollowList): void;
  clear(): void;
}
