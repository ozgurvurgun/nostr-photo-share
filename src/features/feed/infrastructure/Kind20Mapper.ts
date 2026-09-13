import {err, type Result} from '../../../core/result/Result';
import type {SignedNostrEvent} from '../../../infrastructure/nostr/protocol/event';
import {InvalidImagePostError} from '../domain/errors';
import {
  ImagePost,
  createMedia,
  type ImagePostMedia,
} from '../domain/ImagePost';
import {
  PICTURE_EVENT_KIND,
  guessImageMimeFromUrl,
  hasExpirationTag,
  isNip68ImageMimeType,
  normalizeNip68ImageMimeType,
} from '../domain/PictureKind';

type ImetaFields = {
  url?: string;
  m?: string;
  dim?: string;
  alt?: string;
  blurhash?: string;
  x?: string;
  fallback: string[];
};

/**
 * Maps durable NIP-68 kind:20 events -> ImagePost.
 * Events with NIP-40 expiration are stories (see Kind20StoryMapper), not feed posts.
 * V1 reads only the first valid imeta image.
 */
export const Kind20Mapper = {
  fromEvent(event: SignedNostrEvent): Result<ImagePost, InvalidImagePostError> {
    if (event.kind !== PICTURE_EVENT_KIND) {
      return err(new InvalidImagePostError(`Expected kind ${PICTURE_EVENT_KIND}`));
    }
    if (hasExpirationTag(event.tags)) {
      return err(new InvalidImagePostError('Expiring picture belongs in stories, not feed'));
    }

    const titleTag = event.tags.find(tag => tag[0] === 'title');
    const title = titleTag?.[1]?.trim() ?? '';
    if (title.length === 0) {
      return err(new InvalidImagePostError('Missing title tag'));
    }

    const topLevelMime = event.tags.find(tag => tag[0] === 'm')?.[1];
    const media = this.parseFirstImageMedia(event.tags, topLevelMime);
    if (media === null) {
      return err(new InvalidImagePostError('Missing or invalid imeta image'));
    }

    return ImagePost.create({
      id: event.id,
      authorPubkeyHex: event.pubkey,
      title,
      caption: event.content,
      createdAt: event.created_at,
      media,
    });
  },

  parseFirstImageMedia(
    tags: readonly (readonly string[])[],
    topLevelMime?: string,
  ): ImagePostMedia | null {
    for (const tag of tags) {
      if (tag[0] !== 'imeta') {
        continue;
      }
      const fields = parseImetaTag(tag);
      if (!fields.url) {
        continue;
      }

      const mimeCandidates = [
        fields.m,
        topLevelMime,
        guessImageMimeFromUrl(fields.url),
      ];
      let mimeType: string | undefined;
      for (const candidate of mimeCandidates) {
        if (candidate && isNip68ImageMimeType(candidate)) {
          mimeType = normalizeNip68ImageMimeType(candidate);
          break;
        }
      }
      if (!mimeType) {
        continue;
      }

      const dims = parseDim(fields.dim);
      const mediaResult = createMedia({
        url: fields.url,
        mimeType,
        width: dims?.width,
        height: dims?.height,
        sha256: fields.x,
        alt: fields.alt,
        blurhash: fields.blurhash,
        fallbackUrls: fields.fallback,
      });
      if (mediaResult.ok) {
        return mediaResult.value;
      }
    }
    return null;
  },
} as const;

function parseImetaTag(tag: readonly string[]): ImetaFields {
  const fields: ImetaFields = {fallback: []};
  for (let i = 1; i < tag.length; i += 1) {
    const entry = tag[i];
    if (entry === undefined) {
      continue;
    }
    const space = entry.indexOf(' ');
    if (space <= 0) {
      continue;
    }
    const key = entry.slice(0, space);
    const value = entry.slice(space + 1).trim();
    if (value.length === 0) {
      continue;
    }
    if (key === 'fallback') {
      fields.fallback.push(value);
      continue;
    }
    if (key === 'url' || key === 'm' || key === 'dim' || key === 'alt' || key === 'blurhash' || key === 'x') {
      if (fields[key] === undefined) {
        fields[key] = value;
      }
    }
  }
  return fields;
}

function parseDim(raw: string | undefined): {width: number; height: number} | undefined {
  if (!raw) {
    return undefined;
  }
  const match = /^(\d+)x(\d+)$/i.exec(raw.trim());
  if (!match) {
    return undefined;
  }
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return undefined;
  }
  return {width, height};
}
