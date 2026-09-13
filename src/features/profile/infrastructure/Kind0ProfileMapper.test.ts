import type {SignedNostrEvent} from '../../../infrastructure/nostr/protocol/event';
import {Kind0ProfileMapper} from './Kind0ProfileMapper';

function event(partial: Partial<SignedNostrEvent> & {content: string}): SignedNostrEvent {
  return {
    id: partial.id ?? 'aa'.repeat(32),
    pubkey: partial.pubkey ?? 'bb'.repeat(32),
    created_at: partial.created_at ?? 1_700_000_000,
    kind: partial.kind ?? 0,
    tags: partial.tags ?? [],
    content: partial.content,
    sig: partial.sig ?? 'cc'.repeat(64),
  };
}

describe('Kind0ProfileMapper', () => {
  it('parses kind0 JSON into Profile fields', () => {
    const profile = Kind0ProfileMapper.fromEvent(
      event({
        content: JSON.stringify({
          name: 'still',
          display_name: 'Still',
          about: 'photos',
          picture: 'https://cdn.example/a.png',
          nip05: 'still@example.com',
          website: 'https://example.com',
          banner: 'https://cdn.example/b.png',
        }),
      }),
    );

    expect(profile.name).toBe('still');
    expect(profile.displayName).toBe('Still');
    expect(profile.about).toBe('photos');
    expect(profile.picture).toBe('https://cdn.example/a.png');
    expect(profile.nip05).toBe('still@example.com');
    expect(profile.website).toBe('https://example.com');
    expect(profile.banner).toBe('https://cdn.example/b.png');
    expect(profile.nip05Status).toBe('unverified');
  });

  it('falls back from deprecated displayName/username when reading', () => {
    const profile = Kind0ProfileMapper.fromEvent(
      event({
        content: JSON.stringify({
          username: 'legacy_user',
          displayName: 'Legacy Display',
        }),
      }),
    );
    expect(profile.name).toBe('legacy_user');
    expect(profile.displayName).toBe('Legacy Display');
  });

  it('ignores invalid JSON safely', () => {
    const profile = Kind0ProfileMapper.fromEvent(event({content: '{not-json'}));
    expect(profile.name).toBe('');
    expect(profile.displayName).toBe('');
    expect(profile.about).toBe('');
    expect(profile.picture).toBe('');
    expect(profile.nip05).toBeNull();
    expect(profile.eventId).toBe('aa'.repeat(32));
  });

  it('ignores non-object JSON safely', () => {
    const profile = Kind0ProfileMapper.fromEvent(event({content: '[]'}));
    expect(profile.name).toBe('');
    expect(profile.nip05).toBeNull();
  });

  it('maps update intent to kind0 content JSON', () => {
    const json = Kind0ProfileMapper.toContentJson({
      name: 'still',
      displayName: 'Still',
      about: 'bio',
      picture: 'https://cdn.example/a.png',
      nip05: 'still@example.com',
    });
    expect(JSON.parse(json)).toEqual({
      name: 'still',
      display_name: 'Still',
      about: 'bio',
      picture: 'https://cdn.example/a.png',
      nip05: 'still@example.com',
    });
  });

  it('picks latest replaceable by created_at then lowest id', () => {
    const older = event({id: '11'.repeat(32), created_at: 100, content: '{}'});
    const newerLowId = event({id: '22'.repeat(32), created_at: 200, content: '{}'});
    const newerHighId = event({id: '33'.repeat(32), created_at: 200, content: '{}'});
    const picked = Kind0ProfileMapper.pickLatestReplaceable([older, newerHighId, newerLowId]);
    expect(picked?.id).toBe(newerLowId.id);
  });
});
