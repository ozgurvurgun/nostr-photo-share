import {RelayConnectionError, RelayTimeoutError} from '../../../core/errors/errors';
import type {ClientToRelayMessage} from '../protocol/messages';
import type {IRelayTransport} from './IRelayTransport';

export type FakeConnectBehavior = 'ok' | 'fail' | 'timeout';

export class FakeRelayTransport implements IRelayTransport {
  isConnected = false;
  connectBehavior: FakeConnectBehavior = 'ok';
  readonly sent: ClientToRelayMessage[] = [];

  private readonly messageHandlers = new Set<(raw: unknown) => void>();
  private readonly closeHandlers = new Set<() => void>();
  private intentionallyClosed = false;

  constructor(readonly url: string) {}

  async connect(): Promise<void> {
    this.intentionallyClosed = false;

    if (this.connectBehavior === 'fail') {
      throw new RelayConnectionError(`Failed to connect to ${this.url}`);
    }
    if (this.connectBehavior === 'timeout') {
      throw new RelayTimeoutError(`Timed out connecting to ${this.url}`);
    }

    this.isConnected = true;
  }

  send(message: ClientToRelayMessage): void {
    this.sent.push(message);
  }

  close(): void {
    this.intentionallyClosed = true;
    this.disconnect();
  }

  emit(raw: unknown): void {
    for (const handler of this.messageHandlers) {
      handler(raw);
    }
  }

  emitUnexpectedClose(): void {
    this.disconnect();
    for (const handler of this.closeHandlers) {
      handler();
    }
  }

  onMessage(handler: (raw: unknown) => void): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  onClose(handler: () => void): () => void {
    this.closeHandlers.add(handler);
    return () => {
      this.closeHandlers.delete(handler);
    };
  }

  get wasIntentionallyClosed(): boolean {
    return this.intentionallyClosed;
  }

  private disconnect(): void {
    this.isConnected = false;
  }
}
