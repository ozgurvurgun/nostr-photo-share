import {RelayConnectionError, RelayTimeoutError} from '../../../core/errors/errors';
import {toWireClientMessage, type ClientToRelayMessage} from '../protocol/messages';
import type {IRelayTransport} from './IRelayTransport';

export class WebSocketRelayTransport implements IRelayTransport {
  isConnected = false;

  private socket: WebSocket | null = null;
  private connectPromise: Promise<void> | null = null;
  private readonly messageHandlers = new Set<(raw: unknown) => void>();
  private readonly closeHandlers = new Set<() => void>();
  private intentionalClose = false;

  constructor(
    readonly url: string,
    private readonly connectTimeoutMs: number,
  ) {}

  connect(): Promise<void> {
    if (this.isConnected) {
      return Promise.resolve();
    }
    if (this.connectPromise !== null) {
      return this.connectPromise;
    }

    this.connectPromise = new Promise((resolve, reject) => {
      this.intentionalClose = false;

      let settled = false;
      const socket = new WebSocket(this.url);

      const finish = (action: () => void) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeout);
        this.connectPromise = null;
        action();
      };

      const timeout = setTimeout(() => {
        this.intentionalClose = true;
        socket.close();
        finish(() => {
          reject(new RelayTimeoutError(`Timed out connecting to ${this.url}`));
        });
      }, this.connectTimeoutMs);

      socket.onopen = () => {
        finish(() => {
          this.socket = socket;
          this.isConnected = true;
          resolve();
        });
      };

      socket.onerror = () => {
        finish(() => {
          reject(new RelayConnectionError(`Failed to connect to ${this.url}`));
        });
      };

      socket.onmessage = event => {
        try {
          const parsed: unknown = JSON.parse(String(event.data));
          for (const handler of this.messageHandlers) {
            handler(parsed);
          }
        } catch {
          // Ignore malformed frames; the pool must not crash on bad relay data.
        }
      };

      socket.onclose = () => {
        const wasConnected = this.isConnected && this.socket === socket;
        if (this.socket === socket) {
          this.isConnected = false;
          this.socket = null;
        }
        this.connectPromise = null;
        if (!this.intentionalClose && wasConnected) {
          for (const handler of this.closeHandlers) {
            handler();
          }
        }
      };
    });

    return this.connectPromise;
  }

  send(message: ClientToRelayMessage): void {
    if (this.socket === null || !this.isConnected) {
      throw new RelayConnectionError(`Cannot send to disconnected relay ${this.url}`);
    }
    this.socket.send(JSON.stringify(toWireClientMessage(message)));
  }

  close(): void {
    this.intentionalClose = true;
    this.isConnected = false;
    this.connectPromise = null;
    this.socket?.close();
    this.socket = null;
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
}
