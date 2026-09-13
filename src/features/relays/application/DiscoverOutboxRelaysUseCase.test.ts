import {err, ok} from '../../../core/result/Result';
import {RelayList} from '../domain/RelayList';
import {RelayListFetchError} from '../domain/errors';
import {InMemoryRelayListCache} from '../infrastructure/InMemoryRelayListCache';
import {DiscoverOutboxRelaysUseCase} from './DiscoverOutboxRelaysUseCase';
import type {IRelayListRepository} from './ports/IRelayListRepository';

const AUTHOR_A = 'a'.repeat(64);
const AUTHOR_B = 'b'.repeat(64);

function listFor(owner: string, writeUrls: readonly string[]): RelayList {
  const created = RelayList.create({
    ownerPubkeyHex: owner,
    preferences: writeUrls.map(url => ({url, read: false, write: true})),
  });
  if (!created.ok) {
    throw created.error;
  }
  return created.value;
}

describe('DiscoverOutboxRelaysUseCase', () => {
  it('merges write relays from followed authors into the pool', async () => {
    const cache = new InMemoryRelayListCache();
    const replaced: string[][] = [];
    const repository: IRelayListRepository = {
      fetchRelayList: async () => err(new RelayListFetchError('unused')),
      fetchRelayLists: async () =>
        ok([
          listFor(AUTHOR_A, ['wss://a.example/']),
          listFor(AUTHOR_B, ['wss://b.example/', 'wss://a.example/']),
        ]),
      publish: async () => ok(undefined),
    };

    const useCase = new DiscoverOutboxRelaysUseCase(repository, cache, {
      replaceOutboxRelays: async urls => {
        replaced.push([...urls]);
      },
    });

    const result = await useCase.execute([AUTHOR_A, AUTHOR_B]);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.fromCache).toBe(false);
    expect(result.value.relayUrls).toEqual(['wss://a.example', 'wss://b.example']);
    expect(replaced[0]).toEqual(['wss://a.example', 'wss://b.example']);
    expect(cache.get(AUTHOR_A)?.list.writeUrls()).toEqual(['wss://a.example']);
  });

  it('falls back to cached write relays when fetch fails', async () => {
    const cache = new InMemoryRelayListCache();
    cache.set(AUTHOR_A, listFor(AUTHOR_A, ['wss://cached.example/']));
    const replaced: string[][] = [];
    const repository: IRelayListRepository = {
      fetchRelayList: async () => err(new RelayListFetchError('unused')),
      fetchRelayLists: async () => err(new RelayListFetchError('offline')),
      publish: async () => ok(undefined),
    };

    const useCase = new DiscoverOutboxRelaysUseCase(repository, cache, {
      replaceOutboxRelays: async urls => {
        replaced.push([...urls]);
      },
    });

    const result = await useCase.execute([AUTHOR_A]);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.fromCache).toBe(true);
    expect(result.value.relayUrls).toEqual(['wss://cached.example']);
    expect(replaced[0]).toEqual(['wss://cached.example']);
  });

  it('clears outbox when author list is empty', async () => {
    const replaced: string[][] = [];
    const repository: IRelayListRepository = {
      fetchRelayList: async () => err(new RelayListFetchError('unused')),
      fetchRelayLists: async () => ok([]),
      publish: async () => ok(undefined),
    };

    const useCase = new DiscoverOutboxRelaysUseCase(
      repository,
      new InMemoryRelayListCache(),
      {
        replaceOutboxRelays: async urls => {
          replaced.push([...urls]);
        },
      },
    );

    const result = await useCase.execute([]);
    expect(result.ok).toBe(true);
    expect(replaced[0]).toEqual([]);
  });
});
