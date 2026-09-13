import type {RelayList} from '../../domain/RelayList';

export type CachedRelayList = {
  readonly list: RelayList;
  readonly fetchedAt: number;
};

export interface IRelayListCache {
  get(ownerPubkeyHex: string): CachedRelayList | null;
  set(ownerPubkeyHex: string, list: RelayList): void;
  clear(): void;
}
