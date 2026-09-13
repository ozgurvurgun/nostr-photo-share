import {err, ok, type Result} from '../../../core/result/Result';
import {ImageReadError} from '../domain/errors';
import type {IImageFileReader} from '../application/ports/IImageFileReader';

export type ImageFileFetch = (uri: string) => Promise<{
  readonly arrayBuffer: () => Promise<ArrayBuffer>;
}>;

/**
 * Reads local image URI bytes via fetch (works for content:// and file:// in RN).
 */
export class ImageFileReader implements IImageFileReader {
  constructor(private readonly fetchImpl: ImageFileFetch = defaultFetch) {}

  async readBytes(uri: string): Promise<Result<Uint8Array, ImageReadError>> {
    const trimmed = uri.trim();
    if (trimmed.length === 0) {
      return err(new ImageReadError('Image URI is empty'));
    }

    try {
      const response = await this.fetchImpl(trimmed);
      const buffer = await response.arrayBuffer();
      return ok(new Uint8Array(buffer));
    } catch (cause) {
      return err(new ImageReadError('Failed to read image bytes', {cause}));
    }
  }
}

async function defaultFetch(uri: string): Promise<{arrayBuffer: () => Promise<ArrayBuffer>}> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Failed to fetch image URI (HTTP ${response.status})`);
  }
  return response;
}
