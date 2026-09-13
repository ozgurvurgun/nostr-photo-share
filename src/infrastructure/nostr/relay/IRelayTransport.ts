import type {ClientToRelayMessage} from '../protocol/messages';

export interface IRelayTransport {
  readonly url: string;
  readonly isConnected: boolean;
  connect(): Promise<void>;
  send(message: ClientToRelayMessage): void;
  close(): void;
  onMessage(handler: (raw: unknown) => void): () => void;
  onClose(handler: () => void): () => void;
}
