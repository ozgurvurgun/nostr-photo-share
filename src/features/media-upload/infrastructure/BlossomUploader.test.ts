import {ok} from '../../../core/result/Result';
import type {ISigner, SignableEvent, SignedEvent} from '../../auth/application/ports/ISigner';
import {
  BlossomUploader,
  type BlossomHttpClient,
  type HttpPutResponse,
} from './BlossomUploader';

const PUBKEY = 'a'.repeat(64);
const SIG = 'b'.repeat(128);
const EVENT_ID = 'c'.repeat(64);
const SHA = 'f'.repeat(64);
const BYTES = new Uint8Array([9, 8, 7, 6]);

function fakeSigner(): ISigner {
  return {
    async getPublicKey() {
      return ok(PUBKEY);
    },
    async signEvent(event: SignableEvent) {
      const signed: SignedEvent = {
        id: EVENT_ID,
        pubkey: PUBKEY,
        created_at: event.created_at,
        kind: event.kind,
        tags: event.tags,
        content: event.content,
        sig: SIG,
      };
      return ok(signed);
    },
  };
}

describe('BlossomUploader (fake HTTP)', () => {
  it('sends Authorization Nostr header, PUT body, and parses descriptor', async () => {
    const captured: {
      url?: string;
      headers?: Record<string, string>;
      body?: Uint8Array;
    } = {};

    const http: BlossomHttpClient = {
      async put(options: {
        readonly url: string;
        readonly body: Uint8Array;
        readonly headers: Record<string, string>;
        readonly onProgress?: (progress: number) => void;
      }) {
        captured.url = options.url;
        captured.headers = options.headers;
        captured.body = options.body;
        options.onProgress?.(0.5);
        const response: HttpPutResponse = {
          status: 201,
          bodyText: JSON.stringify({
            url: `https://blossom.primal.net/${SHA}.jpg`,
            sha256: SHA,
            size: BYTES.byteLength,
            type: 'image/jpeg',
            uploaded: 1_700_000_000,
          }),
        };
        return response;
      },
    };

    const uploader = new BlossomUploader({
      servers: ['https://blossom.primal.net'],
      getSigner: () => fakeSigner(),
      http,
    });

    const progress: number[] = [];
    const result = await uploader.upload({
      bytes: BYTES,
      mimeType: 'image/jpeg',
      sha256: SHA,
      onProgress: (p: number) => progress.push(p),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(captured.url).toBe('https://blossom.primal.net/upload');
    expect(captured.body).toEqual(BYTES);
    expect(captured.headers?.['Content-Type']).toBe('image/jpeg');
    expect(captured.headers?.['Content-Length']).toBe(String(BYTES.byteLength));
    expect(captured.headers?.['X-SHA-256']).toBe(SHA);
    expect(captured.headers?.Authorization?.startsWith('Nostr ')).toBe(true);
    expect(result.value.url).toBe(`https://blossom.primal.net/${SHA}.jpg`);
    expect(result.value.sha256).toBe(SHA);
    expect(progress).toContain(0.5);
    expect(progress[progress.length - 1]).toBe(1);
  });

  it('rejects sha256 mismatch in descriptor', async () => {
    const http: BlossomHttpClient = {
      async put() {
        return {
          status: 200,
          bodyText: JSON.stringify({
            url: 'https://blossom.primal.net/wrong.jpg',
            sha256: '0'.repeat(64),
            size: 4,
            type: 'image/jpeg',
          }),
        };
      },
    };

    const uploader = new BlossomUploader({
      servers: ['https://blossom.primal.net'],
      getSigner: () => fakeSigner(),
      http,
    });

    const result = await uploader.upload({
      bytes: BYTES,
      mimeType: 'image/jpeg',
      sha256: SHA,
    });
    expect(result.ok).toBe(false);
  });
});
