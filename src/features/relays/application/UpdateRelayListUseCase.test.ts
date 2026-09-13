import {ok} from '../../../core/result/Result';
import type {ISigner, SignedEvent} from '../../auth/application/ports/ISigner';
import {RelayList} from '../domain/RelayList';
import {UpdateRelayListUseCase} from './UpdateRelayListUseCase';
import {ApplyRelayListToPoolUseCase} from './ApplyRelayListToPoolUseCase';
import {InMemoryRelayListCache} from '../infrastructure/InMemoryRelayListCache';
import type {IRelayListRepository} from './ports/IRelayListRepository';
import {RELAY_LIST_KIND} from '../domain/kinds';

const OWNER = 'a'.repeat(64);
const ID = '1'.repeat(64);
const SIG = '2'.repeat(128);

function fakeSigner(pubkey = OWNER): ISigner {
  return {
    getPublicKey: async () => ok(pubkey),
    signEvent: async event =>
      ok({
        id: ID,
        pubkey,
        created_at: event.created_at,
        kind: event.kind,
        tags: event.tags,
        content: event.content,
        sig: SIG,
      } satisfies SignedEvent),
  };
}

describe('UpdateRelayListUseCase', () => {
  it('validates, publishes kind 10002, syncs pool, and caches', async () => {
    let publishedKind: number | null = null;
    let publishedTags: readonly (readonly string[])[] | null = null;
    let syncedUrls: readonly string[] | null = null;

    const empty = RelayList.empty(OWNER);
    expect(empty.ok).toBe(true);
    if (!empty.ok) {
      return;
    }

    const repository: IRelayListRepository = {
      fetchRelayList: async () => ok(empty.value),
      fetchRelayLists: async () => ok([empty.value]),
      publish: async event => {
        publishedKind = event.kind;
        publishedTags = event.tags;
        return ok(undefined);
      },
    };

    const cache = new InMemoryRelayListCache();
    const applyToPool = new ApplyRelayListToPoolUseCase(
      {
        syncRelays: async urls => {
          syncedUrls = urls;
        },
      },
      cache,
    );
    const useCase = new UpdateRelayListUseCase(
      repository,
      cache,
      applyToPool,
      () => fakeSigner(),
    );

    const result = await useCase.execute({
      preferences: [
        {url: 'wss://write.example', read: false, write: true},
        {url: 'wss://read.example', read: true, write: false},
        {url: 'wss://both.example', read: true, write: true},
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(publishedKind).toBe(RELAY_LIST_KIND);
    expect(publishedTags).toEqual([
      ['r', 'wss://write.example', 'write'],
      ['r', 'wss://read.example', 'read'],
      ['r', 'wss://both.example'],
    ]);
    expect(syncedUrls).toEqual([
      'wss://write.example',
      'wss://read.example',
      'wss://both.example',
    ]);
    expect(cache.get(OWNER)?.list.eventId).toBe(ID);
    expect(result.value.writeUrls()).toEqual(['wss://write.example', 'wss://both.example']);
  });

  it('rejects an empty preference list', async () => {
    const empty = RelayList.empty(OWNER);
    expect(empty.ok).toBe(true);
    if (!empty.ok) {
      return;
    }
    const repository: IRelayListRepository = {
      fetchRelayList: async () => ok(empty.value),
      fetchRelayLists: async () => ok([empty.value]),
      publish: async () => ok(undefined),
    };
    const cache = new InMemoryRelayListCache();
    const applyToPool = new ApplyRelayListToPoolUseCase({syncRelays: async () => {}}, cache);
    const useCase = new UpdateRelayListUseCase(
      repository,
      cache,
      applyToPool,
      () => fakeSigner(),
    );

    const result = await useCase.execute({preferences: []});
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe('INVALID_RELAY_LIST');
  });
});
