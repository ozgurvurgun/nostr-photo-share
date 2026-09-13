import {err, ok, type Result} from '../../../core/result/Result';
import type {ISigner} from '../../auth/application/ports/ISigner';
import {MediaUploadError} from '../domain/errors';
import type {
  IMediaUploader,
  MediaUploadRequest,
  MediaUploadResult,
} from '../application/ports/IMediaUploader';
import {buildBlossomUploadAuthorization} from './blossomAuth';

export type XhrUploadProgress = {
  readonly loaded: number;
  readonly total: number;
};

export type HttpPutResponse = {
  readonly status: number;
  readonly bodyText: string;
};

export type BlossomHttpClient = {
  put(options: {
    readonly url: string;
    readonly body: Uint8Array;
    readonly headers: Record<string, string>;
    readonly onProgress?: (progress: number) => void;
  }): Promise<HttpPutResponse>;
};

export type BlossomUploaderOptions = {
  readonly servers: readonly string[];
  readonly getSigner: () => ISigner | null;
  readonly http?: BlossomHttpClient;
  readonly authTtlSeconds?: number;
  readonly scopeAuthToServer?: boolean;
};

type BlobDescriptor = {
  readonly url: string;
  readonly sha256?: string;
  readonly size?: number;
  readonly type?: string;
  readonly uploaded?: number;
};

function normalizeServerBase(server: string): string {
  return server.replace(/\/+$/, '');
}

function serverHost(server: string): string {
  try {
    return new URL(server).hostname.toLowerCase();
  } catch {
    return server.replace(/^https?:\/\//i, '').split('/')[0]?.toLowerCase() ?? server;
  }
}

/**
 * BUD-02 PUT /upload with BUD-11 kind 24242 Authorization (base64url, no padding).
 * Uses XMLHttpRequest by default so upload progress works in React Native.
 */
export class BlossomUploader implements IMediaUploader {
  private readonly servers: readonly string[];
  private readonly getSigner: () => ISigner | null;
  private readonly http: BlossomHttpClient;
  private readonly authTtlSeconds: number | undefined;
  private readonly scopeAuthToServer: boolean;

  constructor(options: BlossomUploaderOptions) {
    this.servers = options.servers;
    this.getSigner = options.getSigner;
    this.http = options.http ?? createXhrBlossomHttpClient();
    this.authTtlSeconds = options.authTtlSeconds;
    this.scopeAuthToServer = options.scopeAuthToServer ?? true;
  }

  async upload(
    request: MediaUploadRequest,
  ): Promise<Result<MediaUploadResult, MediaUploadError>> {
    if (this.servers.length === 0) {
      return err(new MediaUploadError('No Blossom servers configured'));
    }

    const signer = this.getSigner();
    if (signer === null) {
      return err(new MediaUploadError('No signer available for Blossom upload'));
    }

    const sha256 = request.sha256.trim().toLowerCase();
    const errors: string[] = [];

    for (const server of this.servers) {
      const base = normalizeServerBase(server);
      const uploadUrl = `${base}/upload`;

      const auth = await buildBlossomUploadAuthorization(signer, {
        sha256,
        ttlSeconds: this.authTtlSeconds,
        serverHost: this.scopeAuthToServer ? serverHost(base) : undefined,
      });
      if (!auth.ok) {
        errors.push(`${base}: ${auth.error.message}`);
        continue;
      }

      try {
        const response = await this.http.put({
          url: uploadUrl,
          body: request.bytes,
          headers: {
            'Content-Type': request.mimeType,
            'Content-Length': String(request.bytes.byteLength),
            'X-SHA-256': sha256,
            Authorization: auth.value.authorization,
          },
          onProgress: request.onProgress,
        });

        if (response.status !== 200 && response.status !== 201) {
          errors.push(`${base}: HTTP ${response.status} ${response.bodyText.slice(0, 200)}`);
          continue;
        }

        const parsed = parseBlobDescriptor(response.bodyText);
        if (!parsed.ok) {
          errors.push(`${base}: ${parsed.error.message}`);
          continue;
        }

        const descriptor = parsed.value;
        if (descriptor.sha256 && descriptor.sha256.toLowerCase() !== sha256) {
          errors.push(`${base}: response sha256 mismatch`);
          continue;
        }

        request.onProgress?.(1);
        return ok({
          url: descriptor.url,
          sha256: (descriptor.sha256 ?? sha256).toLowerCase(),
          sizeBytes: descriptor.size ?? request.bytes.byteLength,
          mimeType: descriptor.type ?? request.mimeType,
        });
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        errors.push(`${base}: ${message}`);
      }
    }

    return err(
      new MediaUploadError(
        `Blossom upload failed on all servers: ${errors.join('; ') || 'unknown'}`,
      ),
    );
  }
}

export function parseBlobDescriptor(
  bodyText: string,
): Result<BlobDescriptor, MediaUploadError> {
  let json: unknown;
  try {
    json = JSON.parse(bodyText) as unknown;
  } catch (cause) {
    return err(new MediaUploadError('Invalid Blossom blob descriptor JSON', {cause}));
  }

  if (json === null || typeof json !== 'object') {
    return err(new MediaUploadError('Blossom blob descriptor must be an object'));
  }

  const record = json as Record<string, unknown>;
  const url = typeof record.url === 'string' ? record.url.trim() : '';
  if (url.length === 0) {
    return err(new MediaUploadError('Blossom blob descriptor missing url'));
  }

  return ok({
    url,
    sha256: typeof record.sha256 === 'string' ? record.sha256 : undefined,
    size: typeof record.size === 'number' ? record.size : undefined,
    type: typeof record.type === 'string' ? record.type : undefined,
    uploaded: typeof record.uploaded === 'number' ? record.uploaded : undefined,
  });
}

export function createXhrBlossomHttpClient(): BlossomHttpClient {
  return {
    put({url, body, headers, onProgress}) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', url);
        for (const [key, value] of Object.entries(headers)) {
          xhr.setRequestHeader(key, value);
        }
        xhr.upload.onprogress = event => {
          if (!onProgress) {
            return;
          }
          if (event.lengthComputable && event.total > 0) {
            onProgress(Math.min(1, Math.max(0, event.loaded / event.total)));
          }
        };
        xhr.onload = () => {
          resolve({status: xhr.status, bodyText: xhr.responseText ?? ''});
        };
        xhr.onerror = () => {
          reject(new Error('Network error during Blossom upload'));
        };
        xhr.ontimeout = () => {
          reject(new Error('Blossom upload timed out'));
        };
        // RN XHR accepts Uint8Array / ArrayBuffer for binary bodies.
        xhr.send(body);
      });
    },
  };
}
