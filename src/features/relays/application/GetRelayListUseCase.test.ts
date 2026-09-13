import {err, ok} from '../../../core/result/Result';
import {RelayList} from '../domain/RelayList';
import {RelayListFetchError} from '../domain/errors';
import {GetRelayListUseCase} from './GetRelayListUseCase';
import {InMemoryRelayListCache} from '../infrastructure/InMemoryRelayListCache';
import type {IRelayListRepository} from './ports/IRelayListRepository';

const OWNER = 'a'.repeat(64);
const DEFAULTS = ['wss://default.example'] as const;

describe('GetRelayListUseCase', () => {
  it('does not wipe a cached published list when fetch returns empty', async () => {
    const published = RelayList.create({
      ownerPubkeyHex: OWNER,
      preferences: [{url: 'wss://mine.example', read: true, write: true}],
      eventId: 'b'.repeat(64),
      createdAt: 100,
    });
    expect(published.ok).toBe(true);
    if (!published.ok) {
      return;
    }

    const empty = RelayList.empty(OWNER);
    expect(empty.ok).toBe(true);
    if (!empty.ok) {
      return;
    }

    const cache = new InMemoryRelayListCache();
    cache.set(OWNER, published.value);

    const repository: IRelayListRepository = {
      fetchRelayList: async () => ok(empty.value),
      fetchRelayLists: async () => ok([empty.value]),
      publish: async () => ok(undefined),
    };

    const useCase = new GetRelayListUseCase(repository, cache, DEFAULTS);
    const result = await useCase.execute(OWNER);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.preferences[0]?.url).toBe('wss://mine.example');
    expect(result.value.eventId).toBe('b'.repeat(64));
  });

  it('returns cache when fetch fails', async () => {
    const published = RelayList.create({
      ownerPubkeyHex: OWNER,
      preferences: [{url: 'wss://cached.example', read: true, write: true}],
      eventId: 'c'.repeat(64),
      createdAt: 1,
    });
    expect(published.ok).toBe(true);
    if (!published.ok) {
      return;
    }
    const cache = new InMemoryRelayListCache();
    cache.set(OWNER, published.value);

    const repository: IRelayListRepository = {
      fetchRelayList: async () => err(new RelayListFetchError('offline')),
      fetchRelayLists: async () => err(new RelayListFetchError('offline')),
      publish: async () => ok(undefined),
    };

    const useCase = new GetRelayListUseCase(repository, cache, DEFAULTS);
    const result = await useCase.execute(OWNER);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.preferences[0]?.url).toBe('wss://cached.example');
  });
});
