import {ok} from '../../../core/result/Result';
import {InMemoryNostrToolsSigner} from '../../../infrastructure/nostr/crypto/InMemoryNostrToolsSigner';
import type {SignedNostrEvent} from '../../../infrastructure/nostr/protocol/event';
import {UpdateProfileUseCase} from './UpdateProfileUseCase';
import type {INip05Verifier} from './ports/INip05Verifier';
import type {IProfileRepository} from './ports/IProfileRepository';
import {InMemoryProfileCache} from '../infrastructure/InMemoryProfileCache';

describe('UpdateProfileUseCase', () => {
  it('signs, publishes, and updates cache', async () => {
    const signer = InMemoryNostrToolsSigner.generate();
    const pubkey = await signer.getPublicKey();
    if (!pubkey.ok) {
      throw new Error('expected pubkey');
    }

    const published: SignedNostrEvent[] = [];
    const repository: IProfileRepository = {
      fetchByPubkey: jest.fn(),
      publish: jest.fn(async event => {
        published.push(event);
        return ok(undefined);
      }),
    };
    const cache = new InMemoryProfileCache();
    const nip05Verifier: INip05Verifier = {
      verify: jest.fn(async () => ({status: 'verified' as const})),
    };

    const useCase = new UpdateProfileUseCase(repository, cache, nip05Verifier, () => signer);
    const result = await useCase.execute({
      name: 'still',
      displayName: 'Still',
      about: 'hello',
      picture: 'https://cdn.example/a.png',
      nip05: 'still@example.com',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(published).toHaveLength(1);
    expect(published[0]?.kind).toBe(0);
    expect(JSON.parse(published[0]!.content)).toMatchObject({
      name: 'still',
      display_name: 'Still',
      about: 'hello',
      picture: 'https://cdn.example/a.png',
      nip05: 'still@example.com',
    });
    expect(result.value.nip05Status).toBe('verified');
    expect(cache.get(pubkey.value)?.profile.displayName).toBe('Still');
  });

  it('fails when signer is unavailable', async () => {
    const useCase = new UpdateProfileUseCase(
      {fetchByPubkey: jest.fn(), publish: jest.fn()},
      new InMemoryProfileCache(),
      {verify: jest.fn()},
      () => null,
    );
    const result = await useCase.execute({
      name: 'a',
      displayName: 'b',
      about: '',
      picture: '',
      nip05: '',
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe('SIGNER_UNAVAILABLE');
  });
});
