import {Logger, MemoryLogSink} from '../../../core/logging/Logger';
import {InMemoryNostrToolsSigner} from '../crypto/InMemoryNostrToolsSigner';
import {FakeRelayTransport} from '../relay/FakeRelayTransport';
import {RelayPool} from '../relay/RelayPool';
import {EventValidator} from '../validation/EventValidator';
import {NostrGateway} from './NostrGateway';

describe('NostrGateway', () => {
  it('emits only events that pass EventValidator', async () => {
    const relay = new FakeRelayTransport('wss://relay');
    const sink = new MemoryLogSink();
    const pool = new RelayPool({
      logger: new Logger(sink),
      connectTimeoutMs: 20,
      publishTimeoutMs: 20,
      reconnectDelayMs: 5,
      createTransport: () => relay,
    });
    pool.addRelay(relay.url);
    const gateway = new NostrGateway(pool, new EventValidator(), new Logger(sink));
    const received: string[] = [];

    await gateway.connect();
    const {id} = gateway.subscribe({
      filters: [{kinds: [1]}],
      onEvent: event => {
        received.push(event.id);
      },
    });

    const signer = InMemoryNostrToolsSigner.generate();
    const signed = await signer.signEvent({
      created_at: 1_700_000_000,
      kind: 1,
      tags: [],
      content: 'ok',
    });
    if (!signed.ok) {
      throw new Error('expected signed event');
    }

    relay.emit(['EVENT', id, {id: '00'.repeat(32), content: 'bad'}]);
    relay.emit(['EVENT', id, signed.value]);

    expect(received).toEqual([signed.value.id]);
    expect(sink.records.some(record => record.message === 'Dropped invalid relay event')).toBe(
      true,
    );
    gateway.disconnect();
  });

  it('query collects events until EOSE then unsubscribes', async () => {
    const relay = new FakeRelayTransport('wss://relay');
    const sink = new MemoryLogSink();
    const pool = new RelayPool({
      logger: new Logger(sink),
      connectTimeoutMs: 20,
      publishTimeoutMs: 20,
      reconnectDelayMs: 5,
      createTransport: () => relay,
    });
    pool.addRelay(relay.url);
    const gateway = new NostrGateway(pool, new EventValidator(), new Logger(sink));

    await gateway.connect();
    const signer = InMemoryNostrToolsSigner.generate();
    const signed = await signer.signEvent({
      created_at: 1_700_000_000,
      kind: 0,
      tags: [],
      content: JSON.stringify({name: 'still'}),
    });
    if (!signed.ok) {
      throw new Error('expected signed event');
    }

    const queryPromise = gateway.query([{kinds: [0], authors: [signed.value.pubkey], limit: 1}], {
      timeoutMs: 200,
    });

    await Promise.resolve();
    const req = relay.sent.find(message => message[0] === 'REQ');
    expect(req).toBeDefined();
    const subId = req?.[1] as string;
    relay.emit(['EVENT', subId, signed.value]);
    relay.emit(['EOSE', subId]);

    const events = await queryPromise;
    expect(events.map(event => event.id)).toEqual([signed.value.id]);
    expect(relay.sent.some(message => message[0] === 'CLOSE' && message[1] === subId)).toBe(true);
    gateway.disconnect();
  });

  it('refuses to publish an invalid event', async () => {
    const relay = new FakeRelayTransport('wss://relay');
    const sink = new MemoryLogSink();
    const pool = new RelayPool({
      logger: new Logger(sink),
      connectTimeoutMs: 20,
      publishTimeoutMs: 20,
      reconnectDelayMs: 5,
      createTransport: () => relay,
    });
    pool.addRelay(relay.url);
    const gateway = new NostrGateway(pool, new EventValidator(), new Logger(sink));

    await expect(
      gateway.publish({
        id: '00'.repeat(32),
        pubkey: '11'.repeat(32),
        created_at: 1,
        kind: 1,
        tags: [],
        content: 'bad',
        sig: '22'.repeat(64),
      }),
    ).rejects.toMatchObject({code: 'EVENT_VALIDATION'});

    expect(relay.sent.some(message => message[0] === 'EVENT')).toBe(false);
    gateway.disconnect();
  });


  it('waits for EOSE from all relays before finishing early', async () => {
    const fast = new FakeRelayTransport('wss://fast');
    const slow = new FakeRelayTransport('wss://slow');
    const byUrl = new Map([
      [fast.url, fast],
      [slow.url, slow],
    ]);
    const sink = new MemoryLogSink();
    const pool = new RelayPool({
      logger: new Logger(sink),
      connectTimeoutMs: 20,
      publishTimeoutMs: 20,
      reconnectDelayMs: 5,
      createTransport: url => {
        const transport = byUrl.get(url);
        if (!transport) {
          throw new Error(url);
        }
        return transport;
      },
    });
    pool.addRelay(fast.url);
    pool.addRelay(slow.url);
    const gateway = new NostrGateway(pool, new EventValidator(), new Logger(sink));

    await gateway.connect();
    const signer = InMemoryNostrToolsSigner.generate();
    const signed = await signer.signEvent({
      created_at: 1_700_000_000,
      kind: 0,
      tags: [],
      content: JSON.stringify({name: 'from-slow'}),
    });
    if (!signed.ok) {
      throw new Error('expected signed event');
    }

    const queryPromise = gateway.query([{kinds: [0], authors: [signed.value.pubkey], limit: 1}], {
      timeoutMs: 200,
    });

    await Promise.resolve();
    const fastReq = fast.sent.find(message => message[0] === 'REQ');
    const slowReq = slow.sent.find(message => message[0] === 'REQ');
    expect(fastReq).toBeDefined();
    expect(slowReq).toBeDefined();
    const fastSub = fastReq?.[1] as string;
    const slowSub = slowReq?.[1] as string;

    fast.emit(['EOSE', fastSub]);
    await Promise.resolve();
    slow.emit(['EVENT', slowSub, signed.value]);
    slow.emit(['EOSE', slowSub]);

    const events = await queryPromise;
    expect(events.map(event => event.id)).toEqual([signed.value.id]);
    gateway.disconnect();
  });
});
