import {normalizeRelayUrl} from './RelayUrl';

describe('normalizeRelayUrl', () => {
  it('trims, adds wss, lowercases host, strips trailing slash', () => {
    const result = normalizeRelayUrl('  Relay.Example.COM/path/  ');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toBe('wss://relay.example.com/path');
  });

  it('maps http(s) to ws(s) and keeps explicit ws', () => {
    const https = normalizeRelayUrl('https://a.example');
    expect(https.ok).toBe(true);
    if (https.ok) {
      expect(https.value).toBe('wss://a.example');
    }

    const http = normalizeRelayUrl('http://a.example');
    expect(http.ok).toBe(true);
    if (http.ok) {
      expect(http.value).toBe('ws://a.example');
    }

    const ws = normalizeRelayUrl('ws://a.example/');
    expect(ws.ok).toBe(true);
    if (ws.ok) {
      expect(ws.value).toBe('ws://a.example');
    }
  });

  it('rejects empty and non-ws schemes', () => {
    expect(normalizeRelayUrl('').ok).toBe(false);
    expect(normalizeRelayUrl('ftp://relay.example').ok).toBe(false);
  });

  it('strips userinfo credentials from normalized URLs', () => {
    const result = normalizeRelayUrl('wss://user:pass@relay.example/');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toBe('wss://relay.example');
    expect(result.value).not.toContain('user');
    expect(result.value).not.toContain('pass');
  });
});
