import {err, ok} from '../../../core/result/Result';
import type {SignedNostrEvent} from '../../../infrastructure/nostr/protocol/event';
import {GetProfileUseCase} from './GetProfileUseCase';
import type {INip05Verifier} from './ports/INip05Verifier';
import type {IProfileRepository} from './ports/IProfileRepository';
import {ProfileFetchError} from '../domain/errors';
import {emptyProfile, type Profile} from '../domain/Profile';
import {InMemoryProfileCache} from '../infrastructure/InMemoryProfileCache';

const PUBKEY = 'aa'.repeat(32);

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    ...emptyProfile(PUBKEY),
    name: 'still',
    displayName: 'Still',
    about: 'bio',
    eventId: 'ee'.repeat(32),
    createdAt: 1,
    ...overrides,
  };
}

describe('GetProfileUseCase', () => {
  it('fetches, verifies nip05, and caches', async () => {
    const cache = new InMemoryProfileCache();
    const repository: IProfileRepository = {
      fetchByPubkey: jest.fn(async () =>
        ok(profile({nip05: 'still@example.com', nip05Status: 'unverified'})),
      ),
      publish: jest.fn(),
    };
    const nip05Verifier: INip05Verifier = {
      verify: jest.fn(async () => ({status: 'verified' as const})),
    };

    const useCase = new GetProfileUseCase(repository, cache, nip05Verifier);
    const result = await useCase.execute(PUBKEY);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.nip05Status).toBe('verified');
    expect(cache.get(PUBKEY)?.profile.nip05Status).toBe('verified');
    expect(nip05Verifier.verify).toHaveBeenCalled();
  });

  it('returns minimal empty profile when repository has no kind0', async () => {
    const cache = new InMemoryProfileCache();
    const repository: IProfileRepository = {
      fetchByPubkey: jest.fn(async () => ok(emptyProfile(PUBKEY))),
      publish: jest.fn(),
    };
    const nip05Verifier: INip05Verifier = {verify: jest.fn()};

    const useCase = new GetProfileUseCase(repository, cache, nip05Verifier);
    const result = await useCase.execute(PUBKEY);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.name).toBe('');
    expect(result.value.nip05Status).toBe('none');
    expect(nip05Verifier.verify).not.toHaveBeenCalled();
  });

  it('returns cache when fetch fails', async () => {
    const cache = new InMemoryProfileCache();
    cache.set(PUBKEY, profile({displayName: 'Cached'}));
    const repository: IProfileRepository = {
      fetchByPubkey: jest.fn(async () => err(new ProfileFetchError('offline'))),
      publish: jest.fn(),
    };
    const useCase = new GetProfileUseCase(repository, cache, {
      verify: jest.fn(),
    });

    const result = await useCase.execute(PUBKEY);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.displayName).toBe('Cached');
  });

  it('surfaces fetch error when no cache exists', async () => {
    const repository: IProfileRepository = {
      fetchByPubkey: jest.fn(async () => err(new ProfileFetchError('offline'))),
      publish: jest.fn(async (_event: SignedNostrEvent) => ok(undefined)),
    };
    const useCase = new GetProfileUseCase(repository, new InMemoryProfileCache(), {
      verify: jest.fn(),
    });
    const result = await useCase.execute(PUBKEY);
    expect(result.ok).toBe(false);
  });


  it('does not wipe a richer cache when fetch returns empty profile', async () => {
    const cache = new InMemoryProfileCache();
    cache.set(PUBKEY, profile({displayName: 'Cached'}));
    const repository: IProfileRepository = {
      fetchByPubkey: jest.fn(async () => ok(emptyProfile(PUBKEY))),
      publish: jest.fn(),
    };
    const useCase = new GetProfileUseCase(repository, cache, {verify: jest.fn()});

    const result = await useCase.execute(PUBKEY);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.displayName).toBe('Cached');
  });
});
