import {Logger, MemoryLogSink} from '../../../core/logging/Logger';
import {InMemoryNostrToolsSigner} from '../crypto/InMemoryNostrToolsSigner';
import type {SignedNostrEvent} from '../protocol/event';
import {FakeRelayTransport} from './FakeRelayTransport';
import {RelayPool} from './RelayPool';

async function signedEvent(): Promise<SignedNostrEvent> {
  const signer = InMemoryNostrToolsSigner.generate();
  const result = await signer.signEvent({
    created_at: 1_700_000_000,
    kind: 1,
    tags: [],
    content: 'pool',
  });
  if (!result.ok) {
    throw new Error('expected signed event');
  }
  return result.value;
}

function createPool(relays: FakeRelayTransport[], publishTimeoutMs = 30) {
  const byUrl = new Map(relays.map(relay => [relay.url, relay]));
  const pool = new RelayPool({
    logger: new Logger(new MemoryLogSink()),
    connectTimeoutMs: 20,
    publishTimeoutMs,
    reconnectDelayMs: 5,
    createTransport: url => {
      const transport = byUrl.get(url);
      if (transport === undefined) {
        throw new Error(`unexpected relay ${url}`);
      }
      return transport;
    },
  });
  for (const relay of relays) {
    pool.addRelay(relay.url);
  }
  return pool;
}

describe('RelayPool', () => {
  it('keeps serving events when one relay fails to connect', async () => {
    const healthy = new FakeRelayTransport('wss://healthy');
    const broken = new FakeRelayTransport('wss://broken');
    broken.connectBehavior = 'fail';
    const pool = createPool([healthy, broken]);
    const events: unknown[] = [];

    await pool.connect();
    const {id} = pool.subscribe([{kinds: [1]}], {
      onEvent: event => {
        events.push(event);
      },
    });

    healthy.emit(['EVENT', id, {id: 'aa'.repeat(32)}]);

    expect(healthy.isConnected).toBe(true);
    expect(broken.isConnected).toBe(false);
    expect(events).toHaveLength(1);
    pool.disconnect();
  });

  it('deduplicates the same event received from three relays', async () => {
    const relays = [
      new FakeRelayTransport('wss://a'),
      new FakeRelayTransport('wss://b'),
      new FakeRelayTransport('wss://c'),
    ];
    const pool = createPool(relays);
    const events: unknown[] = [];

    await pool.connect();
    const {id} = pool.subscribe([{kinds: [1]}], {
      onEvent: event => {
        events.push(event);
      },
    });

    const payload = {id: 'cd'.repeat(32), content: 'once'};
    for (const relay of relays) {
      relay.emit(['EVENT', id, payload]);
    }

    expect(events).toHaveLength(1);
    pool.disconnect();
  });

  it('does not let one relay publish timeout block the others', async () => {
    const fast = new FakeRelayTransport('wss://fast');
    const slow = new FakeRelayTransport('wss://slow');
    const pool = createPool([fast, slow], 25);
    const event = await signedEvent();

    await pool.connect();
    const publishPromise = pool.publish(event);
    const req = fast.sent.find(message => message[0] === 'EVENT');
    expect(req).toBeDefined();
    fast.emit(['OK', event.id, true, '']);

    const results = await publishPromise;
    const byUrl = Object.fromEntries(results.map(result => [result.relayUrl, result]));

    expect(byUrl['wss://fast']?.accepted).toBe(true);
    expect(byUrl['wss://slow']?.accepted).toBe(false);
    expect(byUrl['wss://slow']?.error?.code).toBe('RELAY_TIMEOUT');
    pool.disconnect();
  });

  it('forwards EOSE, CLOSED, NOTICE, and AUTH', async () => {
    const relay = new FakeRelayTransport('wss://relay');
    const pool = createPool([relay]);
    const eose: string[] = [];
    const closed: string[] = [];
    const notices: string[] = [];
    const auths: string[] = [];

    await pool.connect();
    const {id} = pool.subscribe([{kinds: [1]}], {
      onEose: subscriptionId => {
        eose.push(subscriptionId);
      },
      onClosed: (_subscriptionId, reason) => {
        closed.push(reason);
      },
      onNotice: message => {
        notices.push(message);
      },
      onAuth: challenge => {
        auths.push(challenge);
      },
    });

    relay.emit(['EOSE', id]);
    relay.emit(['CLOSED', id, 'error: shutting down idle subscription']);
    relay.emit(['NOTICE', 'maintenance']);
    relay.emit(['AUTH', 'challenge-1']);

    expect(eose).toEqual([id]);
    expect(closed).toEqual(['error: shutting down idle subscription']);
    expect(notices).toEqual(['maintenance']);
    expect(auths).toEqual(['challenge-1']);
    pool.disconnect();
  });

  it('restores subscriptions after an unexpected disconnect', async () => {
    const relay = new FakeRelayTransport('wss://relay');
    const pool = createPool([relay]);

    await pool.connect();
    const {id} = pool.subscribe([{kinds: [1], authors: ['aa'.repeat(32)]}], {});
    const sentBefore = relay.sent.filter(message => message[0] === 'REQ').length;

    relay.emitUnexpectedClose();
    await new Promise<void>(resolve => {
      setTimeout(resolve, 20);
    });

    const reqs = relay.sent.filter(message => message[0] === 'REQ');
    expect(relay.isConnected).toBe(true);
    expect(reqs.length).toBeGreaterThan(sentBefore);
    expect(reqs.at(-1)?.[1]).toBe(id);
    pool.disconnect();
  });

  it('retries reconnect after a failed attempt', async () => {
    const relay = new FakeRelayTransport('wss://flaky');
    const pool = createPool([relay]);

    await pool.connect();
    expect(relay.isConnected).toBe(true);

    let connectCalls = 0;
    const originalConnect = relay.connect.bind(relay);
    relay.connect = async () => {
      connectCalls += 1;
      if (connectCalls === 1) {
        throw new Error('temporary failure');
      }
      return originalConnect();
    };

    relay.emitUnexpectedClose();
    await new Promise<void>(resolve => {
      setTimeout(resolve, 80);
    });

    expect(connectCalls).toBeGreaterThanOrEqual(2);
    expect(relay.isConnected).toBe(true);
    pool.disconnect();
  });

  it('allows connect after disconnect', async () => {
    const relay = new FakeRelayTransport('wss://relay');
    const pool = createPool([relay]);

    await pool.connect();
    pool.disconnect();
    expect(relay.isConnected).toBe(false);

    await pool.connect();
    expect(relay.isConnected).toBe(true);
    pool.disconnect();
  });

  it('reports relay health for wanted relays', async () => {
    const healthy = new FakeRelayTransport('wss://healthy');
    const broken = new FakeRelayTransport('wss://broken');
    broken.connectBehavior = 'fail';
    const pool = createPool([healthy, broken]);

    await pool.connect();
    const health = pool.getRelayHealth();
    expect(health).toEqual(
      expect.arrayContaining([
        {url: 'wss://healthy', connected: true, reconnecting: false},
        expect.objectContaining({url: 'wss://broken', connected: false}),
      ]),
    );
    pool.disconnect();
  });

  it('removeRelay drops the relay from wanted and health', async () => {
    const a = new FakeRelayTransport('wss://a');
    const b = new FakeRelayTransport('wss://b');
    const pool = createPool([a, b]);
    await pool.connect();

    pool.removeRelay('wss://a');
    expect(pool.getWantedRelayUrls()).toEqual(['wss://b']);
    expect(pool.getRelayHealth().map(entry => entry.url)).toEqual(['wss://b']);
    expect(a.isConnected).toBe(false);
    pool.disconnect();
  });

  it('syncRelays adds new relays and removes extras', async () => {
    const a = new FakeRelayTransport('wss://a');
    const b = new FakeRelayTransport('wss://b');
    const c = new FakeRelayTransport('wss://c');
    const byUrl = new Map([
      [a.url, a],
      [b.url, b],
      [c.url, c],
    ]);
    const pool = new RelayPool({
      logger: new Logger(new MemoryLogSink()),
      connectTimeoutMs: 20,
      publishTimeoutMs: 30,
      reconnectDelayMs: 5,
      createTransport: url => {
        const transport = byUrl.get(url);
        if (transport === undefined) {
          throw new Error(`unexpected relay ${url}`);
        }
        return transport;
      },
    });
    pool.addRelay(a.url);
    pool.addRelay(b.url);
    await pool.connect();

    await pool.syncRelays([b.url, c.url]);
    expect(pool.getWantedRelayUrls().slice().sort()).toEqual(['wss://b', 'wss://c']);
    expect(a.isConnected).toBe(false);
    expect(b.isConnected).toBe(true);
    expect(c.isConnected).toBe(true);
    pool.disconnect();
  });

  it('replaceOutboxRelays preserves core relays across syncRelays', async () => {
    const core = new FakeRelayTransport('wss://core');
    const outbox = new FakeRelayTransport('wss://outbox');
    const byUrl = new Map([
      [core.url, core],
      [outbox.url, outbox],
    ]);
    const pool = new RelayPool({
      logger: new Logger(new MemoryLogSink()),
      connectTimeoutMs: 20,
      publishTimeoutMs: 30,
      reconnectDelayMs: 5,
      createTransport: url => {
        const transport = byUrl.get(url);
        if (transport === undefined) {
          throw new Error(`unexpected relay ${url}`);
        }
        return transport;
      },
    });
    pool.addRelay(core.url);
    await pool.connect();
    await pool.replaceOutboxRelays([outbox.url]);
    expect(pool.getOutboxRelayUrls()).toEqual(['wss://outbox']);
    expect(pool.getWantedRelayUrls().slice().sort()).toEqual(['wss://core', 'wss://outbox']);

    await pool.syncRelays([core.url]);
    expect(pool.getWantedRelayUrls().slice().sort()).toEqual(['wss://core', 'wss://outbox']);
    expect(outbox.isConnected).toBe(true);
    pool.disconnect();
  });
});
