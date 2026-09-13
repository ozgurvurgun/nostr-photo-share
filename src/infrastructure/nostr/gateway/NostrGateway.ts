import type {Logger} from '../../../core/logging/Logger';
import type {NostrFilter} from '../protocol/filter';
import type {SignedNostrEvent} from '../protocol/event';
import type {RelayPool, RelayPoolListener, PublishResult} from '../relay/RelayPool';
import type {EventValidator} from '../validation/EventValidator';

export type NostrGatewaySubscribeInput = {
  readonly filters: readonly NostrFilter[];
  readonly onEvent: (event: SignedNostrEvent) => void;
  readonly onEose?: RelayPoolListener['onEose'];
  readonly onClosed?: RelayPoolListener['onClosed'];
  readonly onNotice?: RelayPoolListener['onNotice'];
  readonly onAuth?: RelayPoolListener['onAuth'];
};

export type NostrGatewayQueryOptions = {
  /** Stop waiting after this many ms even if not all relays have sent EOSE. */
  readonly timeoutMs?: number;
  /**
   * How many distinct relay EOSE messages to wait for before finishing early.
   * Defaults to the number of wanted relays on the pool (at least 1).
   */
  readonly expectedEoseCount?: number;
};

export type NostrGatewayOptions = {
  /**
   * When set and non-empty, `publish` routes to these write relays (NIP-65).
   * Return null/empty to publish to all wanted pool relays.
   */
  readonly getWriteRelayUrls?: () => readonly string[] | null;
};

export class NostrGateway {
  private readonly getWriteRelayUrls: (() => readonly string[] | null) | undefined;

  constructor(
    private readonly pool: RelayPool,
    private readonly validator: EventValidator,
    private readonly logger: Logger,
    options: NostrGatewayOptions = {},
  ) {
    this.getWriteRelayUrls = options.getWriteRelayUrls;
  }

  subscribe(input: NostrGatewaySubscribeInput): {id: string; unsubscribe: () => void} {
    return this.pool.subscribe(input.filters, {
      onEvent: (event, meta) => {
        const validated = this.validator.validate(event);
        if (!validated.ok) {
          this.logger.warn('Dropped invalid relay event', {
            relayUrl: meta.relayUrl,
            code: validated.error.code,
          });
          return;
        }
        input.onEvent(validated.value);
      },
      onEose: input.onEose,
      onClosed: input.onClosed,
      onNotice: input.onNotice,
      onAuth: input.onAuth,
    });
  }

  /**
   * One-shot query: subscribe, collect validated events until EOSE from the
   * expected relay count OR timeout, then unsubscribe.
   * Does not fail-fast if a relay fails.
   */
  async query(
    filters: readonly NostrFilter[],
    options: NostrGatewayQueryOptions = {},
  ): Promise<SignedNostrEvent[]> {
    const timeoutMs = options.timeoutMs ?? 8_000;
    const expectedEose =
      options.expectedEoseCount ?? Math.max(1, this.pool.getWantedRelayCount());
    const events: SignedNostrEvent[] = [];
    const seenIds = new Set<string>();
    const eoseRelays = new Set<string>();

    return new Promise(resolve => {
      let settled = false;

      const finish = (): void => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        unsubscribe();
        resolve(events);
      };

      const timer = setTimeout(finish, timeoutMs);

      const {unsubscribe} = this.subscribe({
        filters,
        onEvent: event => {
          if (seenIds.has(event.id)) {
            return;
          }
          seenIds.add(event.id);
          events.push(event);
        },
        onEose: (_subscriptionId, relayUrl) => {
          eoseRelays.add(relayUrl);
          if (eoseRelays.size >= expectedEose) {
            finish();
          }
        },
      });
    });
  }

  async publish(event: SignedNostrEvent): Promise<PublishResult[]> {
    const validated = this.validator.validate(event);
    if (!validated.ok) {
      this.logger.warn('Refused to publish invalid event', {
        code: validated.error.code,
      });
      throw validated.error;
    }
    const writeUrls = this.getWriteRelayUrls?.() ?? null;
    // null -> no NIP-65 routing configured -> all wanted
    if (writeUrls === null) {
      return this.pool.publish(validated.value);
    }
    // Explicit empty write set -> do not fall through to all relays
    if (writeUrls.length === 0) {
      this.logger.warn('Refused to publish: NIP-65 write relay set is empty');
      return [
        {
          relayUrl: '',
          accepted: false,
          message: 'No write relays configured in NIP-65 list',
        },
      ];
    }
    return this.pool.publishTo(validated.value, writeUrls);
  }

  /** Publish to an explicit relay URL set (NIP-65 write relays). */
  async publishTo(
    event: SignedNostrEvent,
    relayUrls: readonly string[],
  ): Promise<PublishResult[]> {
    const validated = this.validator.validate(event);
    if (!validated.ok) {
      this.logger.warn('Refused to publish invalid event', {
        code: validated.error.code,
      });
      throw validated.error;
    }
    return this.pool.publishTo(validated.value, relayUrls);
  }

  getRelayHealth(): ReturnType<RelayPool['getRelayHealth']> {
    return this.pool.getRelayHealth();
  }

  syncRelays(urls: readonly string[]): Promise<void> {
    return this.pool.syncRelays(urls);
  }

  connect(): Promise<void> {
    return this.pool.connect();
  }

  disconnect(): void {
    this.pool.disconnect();
  }
}
