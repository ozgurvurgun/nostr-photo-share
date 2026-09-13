import {
  RelayConnectionError,
  RelayTimeoutError,
  type AppError,
} from '../../../core/errors/errors';
import type {Logger} from '../../../core/logging/Logger';
import type {SignedNostrEvent} from '../protocol/event';
import type {NostrFilter} from '../protocol/filter';
import {parseRelayMessage, type ClientToRelayMessage} from '../protocol/messages';
import {EventIdDeduper} from './dedupe';
import type {IRelayTransport} from './IRelayTransport';

export type RelayPoolListener = {
  readonly onEvent?: (event: unknown, meta: {relayUrl: string; subscriptionId: string}) => void;
  readonly onEose?: (subscriptionId: string, relayUrl: string) => void;
  readonly onClosed?: (subscriptionId: string, reason: string, relayUrl: string) => void;
  readonly onNotice?: (message: string, relayUrl: string) => void;
  readonly onAuth?: (challenge: string, relayUrl: string) => void;
};

export type PublishResult = {
  readonly relayUrl: string;
  readonly accepted: boolean;
  readonly message: string;
  readonly error?: AppError;
};

export type RelayHealth = {
  readonly url: string;
  readonly connected: boolean;
  readonly reconnecting: boolean;
};

export type RelayPoolOptions = {
  readonly logger: Logger;
  readonly connectTimeoutMs: number;
  readonly publishTimeoutMs: number;
  readonly reconnectDelayMs: number;
  readonly maxReconnectDelayMs?: number;
  readonly createTransport: (url: string) => IRelayTransport;
};

type ActiveSubscription = {
  readonly filters: readonly NostrFilter[];
  readonly listener: RelayPoolListener;
};

function createSubscriptionId(): string {
  const bytes = new Uint8Array(16);
  const cryptoApi = (globalThis as {crypto?: {getRandomValues: (buffer: Uint8Array) => Uint8Array}})
    .crypto;
  if (cryptoApi !== undefined) {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 64);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export class RelayPool {
  private readonly transports = new Map<string, IRelayTransport>();
  private readonly wanted = new Set<string>();
  /** Outbox write relays for followed authors; preserved across viewer syncRelays. */
  private readonly outbox = new Set<string>();
  private readonly subscriptions = new Map<string, ActiveSubscription>();
  private readonly deduper = new EventIdDeduper();
  private readonly pendingOk = new Map<
    string,
    Set<(result: {accepted: boolean; message: string; relayUrl: string}) => void>
  >();
  private readonly reconnecting = new Set<string>();
  private readonly reconnectAttempts = new Map<string, number>();
  private disposed = false;

  constructor(private readonly options: RelayPoolOptions) {}

  addRelay(url: string): void {
    this.wanted.add(url);
    if (this.transports.has(url)) {
      return;
    }

    const transport = this.options.createTransport(url);
    transport.onMessage(raw => {
      this.handleMessage(url, raw);
    });
    transport.onClose(() => {
      this.handleUnexpectedClose(url);
    });
    this.transports.set(url, transport);
  }

  async connect(): Promise<void> {
    this.disposed = false;
    await Promise.allSettled(
      [...this.wanted].map(async url => {
        try {
          await this.connectOne(url);
        } catch {
          this.scheduleReconnect(url);
        }
      }),
    );
  }

  subscribe(
    filters: readonly NostrFilter[],
    listener: RelayPoolListener,
  ): {id: string; unsubscribe: () => void} {
    const id = createSubscriptionId();
    this.subscriptions.set(id, {filters, listener});
    this.broadcast(['REQ', id, ...filters]);
    return {
      id,
      unsubscribe: () => {
        this.subscriptions.delete(id);
        this.broadcast(['CLOSE', id]);
      },
    };
  }

  getWantedRelayCount(): number {
    return this.wanted.size;
  }

  /** How many wanted relays currently have an open transport. */
  getConnectedRelayCount(): number {
    let count = 0;
    for (const url of this.wanted) {
      if (this.transports.get(url)?.isConnected) {
        count += 1;
      }
    }
    return count;
  }

  getWantedRelayUrls(): readonly string[] {
    return [...this.wanted];
  }

  getRelayHealth(): readonly RelayHealth[] {
    return [...this.wanted].map(url => ({
      url,
      connected: this.transports.get(url)?.isConnected === true,
      reconnecting: this.reconnecting.has(url),
    }));
  }

  /**
   * Remove a relay from the wanted set and close its transport.
   * Active subscriptions stop receiving from this URL.
   */
  removeRelay(url: string): void {
    this.wanted.delete(url);
    this.outbox.delete(url);
    this.reconnecting.delete(url);
    this.reconnectAttempts.delete(url);
    this.rejectPendingOkForRelay(url, 'Relay removed from pool');
    const transport = this.transports.get(url);
    if (transport !== undefined) {
      transport.close();
      this.transports.delete(url);
    }
  }

  /**
   * Replace wanted relays with `urls` (normalized caller-side), keeping outbox extras.
   * Connects new ones; removes extras. Does not fail-fast on connect errors.
   */
  async syncRelays(urls: readonly string[]): Promise<void> {
    await this.applyWantedSet([...urls, ...this.outbox]);
  }

  /**
   * Replace the outbox (followed authors' write relays) without dropping the viewer's core set.
   */
  async replaceOutboxRelays(urls: readonly string[]): Promise<void> {
    const core = [...this.wanted].filter(url => !this.outbox.has(url));
    this.outbox.clear();
    for (const url of urls) {
      this.outbox.add(url);
    }
    await this.applyWantedSet([...core, ...this.outbox]);
  }

  async clearOutboxRelays(): Promise<void> {
    await this.replaceOutboxRelays([]);
  }

  getOutboxRelayUrls(): readonly string[] {
    return [...this.outbox];
  }

  private async applyWantedSet(urls: readonly string[]): Promise<void> {
    const next = new Set(urls);
    for (const url of [...this.wanted]) {
      if (!next.has(url)) {
        this.wanted.delete(url);
        this.reconnecting.delete(url);
        this.reconnectAttempts.delete(url);
        this.rejectPendingOkForRelay(url, 'Relay removed from pool');
        const transport = this.transports.get(url);
        if (transport !== undefined) {
          transport.close();
          this.transports.delete(url);
        }
      }
    }
    for (const url of next) {
      this.addRelay(url);
    }
    await this.connect();
  }

  /**
   * Publish to specific relays (write set).
   * Does not permanently expand the wanted set - temporary relays are removed after.
   * An explicit empty list returns no results (caller must not treat as success).
   */
  async publishTo(
    event: SignedNostrEvent,
    relayUrls?: readonly string[],
  ): Promise<PublishResult[]> {
    if (relayUrls !== undefined && relayUrls.length === 0) {
      return [];
    }

    const urls = relayUrls !== undefined ? [...relayUrls] : [...this.wanted];
    const ephemeral: string[] = [];
    for (const url of urls) {
      if (!this.wanted.has(url)) {
        this.addRelay(url);
        ephemeral.push(url);
      }
    }

    try {
      return await Promise.all(urls.map(url => this.publishToRelay(url, event)));
    } finally {
      for (const url of ephemeral) {
        this.removeRelay(url);
      }
    }
  }

  async publish(event: SignedNostrEvent): Promise<PublishResult[]> {
    return this.publishTo(event);
  }

  disconnect(): void {
    this.disposed = true;
    this.outbox.clear();
    this.reconnecting.clear();
    this.reconnectAttempts.clear();
    this.rejectPendingOk('Relay pool disconnected');
    for (const transport of this.transports.values()) {
      transport.close();
    }
    this.subscriptions.clear();
  }

  private rejectPendingOk(message: string): void {
    for (const [key, waiters] of this.pendingOk) {
      const relayUrl = key.slice(0, key.lastIndexOf(':'));
      for (const waiter of waiters) {
        waiter({
          accepted: false,
          message,
          relayUrl,
        });
      }
    }
    this.pendingOk.clear();
  }

  private rejectPendingOkForRelay(relayUrl: string, message: string): void {
    for (const [key, waiters] of [...this.pendingOk.entries()]) {
      if (!key.startsWith(`${relayUrl}:`)) {
        continue;
      }
      for (const waiter of waiters) {
        waiter({
          accepted: false,
          message,
          relayUrl,
        });
      }
      this.pendingOk.delete(key);
    }
  }

  private async connectOne(url: string): Promise<void> {
    if (this.disposed) {
      return;
    }

    const transport = this.transports.get(url);
    if (transport === undefined || transport.isConnected) {
      return;
    }

    try {
      await transport.connect();
      this.reconnectAttempts.delete(url);
      this.restoreSubscriptions(transport);
    } catch (error) {
      this.options.logger.warn('Relay connect failed', {
        relayUrl: url,
        error,
      });
      throw error;
    }
  }

  private restoreSubscriptions(transport: IRelayTransport): void {
    for (const [id, subscription] of this.subscriptions) {
      this.safeSend(transport, ['REQ', id, ...subscription.filters]);
    }
  }

  private broadcast(message: ClientToRelayMessage): void {
    for (const url of this.wanted) {
      const transport = this.transports.get(url);
      if (transport?.isConnected) {
        this.safeSend(transport, message);
      }
    }
  }

  private safeSend(transport: IRelayTransport, message: ClientToRelayMessage): void {
    try {
      transport.send(message);
    } catch (error) {
      this.options.logger.warn('Failed to send relay message', {
        relayUrl: transport.url,
        error,
      });
    }
  }

  private async publishToRelay(
    url: string,
    event: SignedNostrEvent,
  ): Promise<PublishResult> {
    const transport = this.transports.get(url);
    if (transport === undefined) {
      return {
        relayUrl: url,
        accepted: false,
        message: 'Relay is not configured',
        error: new RelayConnectionError(`Relay is not configured: ${url}`),
      };
    }

    try {
      if (!transport.isConnected) {
        await this.connectOne(url);
      }
    } catch (error) {
      const appError =
        error instanceof RelayTimeoutError || error instanceof RelayConnectionError
          ? error
          : new RelayConnectionError(`Failed to connect to ${url}`, {cause: error});
      return {
        relayUrl: url,
        accepted: false,
        message: appError.message,
        error: appError,
      };
    }

    return new Promise(resolve => {
      const key = `${url}:${event.id}`;
      const waiters = this.pendingOk.get(key) ?? new Set();
      const timeout = setTimeout(() => {
        waiters.delete(onOk);
        if (waiters.size === 0) {
          this.pendingOk.delete(key);
        }
        resolve({
          relayUrl: url,
          accepted: false,
          message: 'Publish timed out',
          error: new RelayTimeoutError(`Timed out publishing to ${url}`),
        });
      }, this.options.publishTimeoutMs);

      const onOk = (result: {accepted: boolean; message: string; relayUrl: string}) => {
        clearTimeout(timeout);
        waiters.delete(onOk);
        if (waiters.size === 0) {
          this.pendingOk.delete(key);
        }
        resolve({
          relayUrl: result.relayUrl,
          accepted: result.accepted,
          message: result.message,
        });
      };

      waiters.add(onOk);
      this.pendingOk.set(key, waiters);
      this.safeSend(transport, ['EVENT', event]);
    });
  }

  private handleMessage(relayUrl: string, raw: unknown): void {
    const message = parseRelayMessage(raw);

    switch (message.type) {
      case 'EVENT': {
        const subscription = this.subscriptions.get(message.subscriptionId);
        if (subscription === undefined) {
          return;
        }
        const eventId = readEventId(message.event);
        if (eventId !== undefined) {
          const first = this.deduper.take(`${message.subscriptionId}:${eventId}`);
          if (!first) {
            return;
          }
        }
        subscription.listener.onEvent?.(message.event, {
          relayUrl,
          subscriptionId: message.subscriptionId,
        });
        return;
      }
      case 'OK': {
        const key = `${relayUrl}:${message.eventId}`;
        const waiters = this.pendingOk.get(key);
        if (waiters !== undefined) {
          for (const waiter of waiters) {
            waiter({
              accepted: message.accepted,
              message: message.message,
              relayUrl,
            });
          }
        }
        return;
      }
      case 'EOSE': {
        this.subscriptions
          .get(message.subscriptionId)
          ?.listener.onEose?.(message.subscriptionId, relayUrl);
        return;
      }
      case 'CLOSED': {
        this.subscriptions
          .get(message.subscriptionId)
          ?.listener.onClosed?.(message.subscriptionId, message.message, relayUrl);
        return;
      }
      case 'NOTICE': {
        this.options.logger.info('Relay notice', {relayUrl, notice: message.message});
        for (const subscription of this.subscriptions.values()) {
          subscription.listener.onNotice?.(message.message, relayUrl);
        }
        return;
      }
      case 'AUTH': {
        this.options.logger.info('Relay AUTH challenge received', {relayUrl});
        for (const subscription of this.subscriptions.values()) {
          subscription.listener.onAuth?.(message.challenge, relayUrl);
        }
        return;
      }
      case 'UNKNOWN':
        this.options.logger.debug('Ignored unknown relay message', {relayUrl});
        return;
    }
  }

  private handleUnexpectedClose(url: string): void {
    this.scheduleReconnect(url);
  }

  private scheduleReconnect(url: string): void {
    if (this.disposed || !this.wanted.has(url) || this.reconnecting.has(url)) {
      return;
    }

    this.reconnecting.add(url);
    this.options.logger.warn('Relay disconnected; reconnecting', {relayUrl: url});
    void this.reconnect(url);
  }

  private async reconnect(url: string): Promise<void> {
    const maxDelay = this.options.maxReconnectDelayMs ?? 30_000;

    try {
      while (!this.disposed && this.wanted.has(url)) {
        const attempt = this.reconnectAttempts.get(url) ?? 0;
        const baseDelayMs = Math.min(
          this.options.reconnectDelayMs * 2 ** attempt,
          maxDelay,
        );
        // Full jitter avoids reconnect stampedes across clients.
        const delayMs = Math.floor(baseDelayMs * Math.random());
        this.reconnectAttempts.set(url, attempt + 1);
        await delay(delayMs);

        if (this.disposed || !this.wanted.has(url)) {
          return;
        }

        const transport = this.transports.get(url);
        if (transport?.isConnected) {
          this.reconnectAttempts.delete(url);
          return;
        }

        try {
          await this.connectOne(url);
          return;
        } catch (error) {
          this.options.logger.warn('Relay reconnect failed', {relayUrl: url, error});
        }
      }
    } finally {
      this.reconnecting.delete(url);
    }
  }
}

function readEventId(event: unknown): string | undefined {
  if (event !== null && typeof event === 'object' && 'id' in event) {
    const id = (event as {id?: unknown}).id;
    return typeof id === 'string' ? id : undefined;
  }
  return undefined;
}
