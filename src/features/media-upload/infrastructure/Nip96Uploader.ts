import {err, ok, type Result} from '../../../core/result/Result';
import type {ISigner} from '../../auth/application/ports/ISigner';
import {MediaUploadError} from '../domain/errors';
import type {
  IMediaUploader,
  MediaUploadRequest,
  MediaUploadResult,
} from '../application/ports/IMediaUploader';
import {buildNip98Authorization} from './nip98Auth';

export type Nip96Fetch = (
  input: string,
  init?: {
    readonly method?: string;
    readonly headers?: Record<string, string>;
    readonly body?: FormData | Uint8Array | string;
  },
) => Promise<{
  readonly ok: boolean;
  readonly status: number;
  readonly text: () => Promise<string>;
  readonly json: () => Promise<unknown>;
}>;

export type Nip96UploaderOptions = {
  readonly servers: readonly string[];
  readonly getSigner: () => ISigner | null;
  readonly fetchImpl?: Nip96Fetch;
  /** When true, include NIP-98 `payload` tag (sha256 of multipart body is skipped; uses file hash). */
  readonly includePayloadTag?: boolean;
};

type Nip96ServerInfo = {
  readonly apiUrl: string;
};

/**
 * NIP-96 uploader (unrecommended but still used). Implements IMediaUploader
 * behind the same port as Blossom for optional fallback / config selection.
 */
export class Nip96Uploader implements IMediaUploader {
  private readonly servers: readonly string[];
  private readonly getSigner: () => ISigner | null;
  private readonly fetchImpl: Nip96Fetch;
  private readonly includePayloadTag: boolean;

  constructor(options: Nip96UploaderOptions) {
    this.servers = options.servers;
    this.getSigner = options.getSigner;
    this.fetchImpl =
      options.fetchImpl ??
      ((input, init) =>
        fetch(input, init as RequestInit).then(async response => ({
          ok: response.ok,
          status: response.status,
          text: () => response.text(),
          json: () => response.json() as Promise<unknown>,
        })));
    this.includePayloadTag = options.includePayloadTag ?? true;
  }

  async upload(
    request: MediaUploadRequest,
  ): Promise<Result<MediaUploadResult, MediaUploadError>> {
    if (this.servers.length === 0) {
      return err(new MediaUploadError('No NIP-96 servers configured'));
    }

    const signer = this.getSigner();
    if (signer === null) {
      return err(new MediaUploadError('No signer available for NIP-96 upload'));
    }

    const errors: string[] = [];

    for (const server of this.servers) {
      try {
        const info = await this.resolveApiUrl(server);
        if (!info.ok) {
          errors.push(`${server}: ${info.error.message}`);
          continue;
        }

        const apiUrl = info.value.apiUrl;
        const form = new FormData();
        const fileName = request.fileName ?? guessFileName(request.mimeType);
        // React Native FormData accepts {uri, type, name} objects; for tests/Uint8Array
        // we attach a Blob when available, otherwise a stub file descriptor is fine in RN.
        const filePart = createFormFilePart(request.bytes, request.mimeType, fileName);
        form.append('file', filePart as unknown as Blob);

        const auth = await buildNip98Authorization(signer, {
          url: apiUrl,
          method: 'POST',
          payloadSha256: this.includePayloadTag ? request.sha256 : undefined,
        });
        if (!auth.ok) {
          errors.push(`${server}: ${auth.error.message}`);
          continue;
        }

        request.onProgress?.(0.1);
        const response = await this.fetchImpl(apiUrl, {
          method: 'POST',
          headers: {
            Authorization: auth.value.authorization,
            Accept: 'application/json',
          },
          body: form,
        });
        request.onProgress?.(0.9);

        if (!response.ok && response.status !== 200 && response.status !== 201) {
          const bodyText = await response.text();
          errors.push(`${server}: HTTP ${response.status} ${bodyText.slice(0, 200)}`);
          continue;
        }

        const json = await response.json();
        const parsed = parseNip96UploadResponse(json, request);
        if (!parsed.ok) {
          errors.push(`${server}: ${parsed.error.message}`);
          continue;
        }

        request.onProgress?.(1);
        return ok(parsed.value);
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        errors.push(`${server}: ${message}`);
      }
    }

    return err(
      new MediaUploadError(
        `NIP-96 upload failed on all servers: ${errors.join('; ') || 'unknown'}`,
      ),
    );
  }

  private async resolveApiUrl(
    server: string,
  ): Promise<Result<Nip96ServerInfo, MediaUploadError>> {
    const base = server.replace(/\/+$/, '');
    const wellKnown = `${base}/.well-known/nostr/nip96.json`;
    try {
      const response = await this.fetchImpl(wellKnown, {method: 'GET'});
      if (!response.ok) {
        return err(
          new MediaUploadError(`Failed to fetch NIP-96 well-known (${response.status})`),
        );
      }
      const json = (await response.json()) as Record<string, unknown>;
      const apiUrlRaw = json.api_url;
      if (typeof apiUrlRaw !== 'string' || apiUrlRaw.trim().length === 0) {
        return err(new MediaUploadError('NIP-96 well-known missing api_url'));
      }
      const apiUrl = resolveMaybeRelativeUrl(apiUrlRaw.trim(), base);
      return ok({apiUrl});
    } catch (cause) {
      return err(
        new MediaUploadError('Failed to resolve NIP-96 api_url', {cause}),
      );
    }
  }
}

function resolveMaybeRelativeUrl(apiUrl: string, serverBase: string): string {
  try {
    return new URL(apiUrl, serverBase.endsWith('/') ? serverBase : `${serverBase}/`).href;
  } catch {
    return apiUrl;
  }
}

function guessFileName(mimeType: string): string {
  if (mimeType === 'image/png') {
    return 'upload.png';
  }
  if (mimeType === 'image/webp') {
    return 'upload.webp';
  }
  return 'upload.jpg';
}

function createFormFilePart(
  bytes: Uint8Array,
  mimeType: string,
  fileName: string,
): Blob | {uri: string; type: string; name: string; data?: Uint8Array} {
  if (typeof Blob !== 'undefined') {
    try {
      const copy = Uint8Array.from(bytes);
      // RN/DOM Blob typings vary; cast keeps binary upload working.
      return new (Blob as unknown as new (parts: unknown[], opts?: {type?: string}) => Blob)(
        [copy],
        {type: mimeType},
      );
    } catch {
      // fall through
    }
  }
  // React Native FormData file shape (tests can mock FormData.append).
  return {
    uri: `data:${mimeType};base64,`,
    type: mimeType,
    name: fileName,
    data: bytes,
  };
}

export function parseNip96UploadResponse(
  json: unknown,
  fallback: {readonly mimeType: string; readonly sha256: string; readonly bytes: Uint8Array},
): Result<MediaUploadResult, MediaUploadError> {
  if (json === null || typeof json !== 'object') {
    return err(new MediaUploadError('NIP-96 response must be an object'));
  }
  const root = json as Record<string, unknown>;

  // Common shapes: {url}, {nip94_event: {tags}}, status + data nesting
  const directUrl = typeof root.url === 'string' ? root.url.trim() : '';
  if (directUrl.length > 0) {
    return ok({
      url: directUrl,
      sha256: fallback.sha256,
      sizeBytes: fallback.bytes.byteLength,
      mimeType: fallback.mimeType,
    });
  }

  const nip94 = root.nip94_event;
  if (nip94 && typeof nip94 === 'object') {
    const tags = (nip94 as {tags?: unknown}).tags;
    const urlFromTags = extractUrlFromNip94Tags(tags);
    if (urlFromTags) {
      const shaFromTags = extractTagValue(tags, 'x') ?? fallback.sha256;
      const mimeFromTags = extractTagValue(tags, 'm') ?? fallback.mimeType;
      const sizeRaw = extractTagValue(tags, 'size');
      const sizeBytes = sizeRaw ? Number.parseInt(sizeRaw, 10) : fallback.bytes.byteLength;
      return ok({
        url: urlFromTags,
        sha256: shaFromTags.toLowerCase(),
        sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : fallback.bytes.byteLength,
        mimeType: mimeFromTags,
      });
    }
  }

  // Nested data.url (some servers)
  const data = root.data;
  if (data && typeof data === 'object') {
    const nested = data as Record<string, unknown>;
    if (typeof nested.url === 'string' && nested.url.trim().length > 0) {
      return ok({
        url: nested.url.trim(),
        sha256: fallback.sha256,
        sizeBytes: fallback.bytes.byteLength,
        mimeType: fallback.mimeType,
      });
    }
  }

  return err(new MediaUploadError('NIP-96 response missing hosted URL'));
}

function extractUrlFromNip94Tags(tags: unknown): string | null {
  return extractTagValue(tags, 'url');
}

function extractTagValue(tags: unknown, name: string): string | null {
  if (!Array.isArray(tags)) {
    return null;
  }
  for (const tag of tags) {
    if (!Array.isArray(tag) || tag.length < 2) {
      continue;
    }
    if (tag[0] === name && typeof tag[1] === 'string' && tag[1].trim().length > 0) {
      return tag[1].trim();
    }
  }
  return null;
}
