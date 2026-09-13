import {parseDeepLink} from './linking';

describe('parseDeepLink', () => {
  it('parses bunker:// URIs', () => {
    const route = parseDeepLink('bunker://abc123?relay=wss://relay.example');
    expect(route).toEqual({
      type: 'bunker',
      uri: 'bunker://abc123?relay=wss://relay.example',
    });
  });

  it('parses nostrconnect:// URIs', () => {
    const route = parseDeepLink('nostrconnect://pubkey?relay=wss://relay.example');
    expect(route?.type).toBe('nostrconnect');
  });

  it('parses nprofile and nevent via nostr: scheme', () => {
    expect(parseDeepLink('nostr:nprofile1qqsomething')?.type).toBe('nprofile');
    expect(parseDeepLink('nostr:nevent1qqsomething')?.type).toBe('nevent');
  });
});
