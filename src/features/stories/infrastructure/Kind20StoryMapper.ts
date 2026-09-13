import {err, type Result} from '../../../core/result/Result';
import type {SignedNostrEvent} from '../../../infrastructure/nostr/protocol/event';
import {InvalidStoryError} from '../domain/errors';
import {
  createStoryMedia,
  Story,
  validateExpiration,
  type StoryMedia,
} from '../domain/Story';
import {
  guessStoryImageMimeFromUrl,
  hasExpirationTag,
  isStoryImageMimeType,
  normalizeStoryImageMimeType,
  STORY_KIND,
} from '../domain/StoryKind';

type ImetaFields = {
  url?: string;
  m?: string;
  dim?: string;
  alt?: string;
  x?: string;
};

/**
 * Maps NIP-68 kind:20 + NIP-40 expiration events -> Story.
 * Durable kind:20 posts (no expiration) are rejected here and belong in the feed.
 */
export const Kind20StoryMapper = {
  fromEvent(event: SignedNostrEvent): Result<Story, InvalidStoryError> {
    if (event.kind !== STORY_KIND) {
      return err(new InvalidStoryError(`Expected kind ${STORY_KIND}`));
    }
    if (!hasExpirationTag(event.tags)) {
      return err(new InvalidStoryError('Missing expiration tag'));
    }

    const expirationTag = event.tags.find(tag => tag[0] === 'expiration');
    const expirationRaw = expirationTag?.[1]?.trim() ?? '';
    if (!/^-?\d+$/.test(expirationRaw)) {
      return err(new InvalidStoryError('expiration tag must be numeric'));
    }
    const expiresAt = Number(expirationRaw);
    const expirationResult = validateExpiration(event.created_at, expiresAt);
    if (!expirationResult.ok) {
      return expirationResult;
    }

    const topLevelMime = event.tags.find(tag => tag[0] === 'm')?.[1];
    const media = this.parseFirstImageMedia(event.tags, topLevelMime);
    if (media === null) {
      return err(new InvalidStoryError('Missing or invalid imeta image'));
    }

    return Story.create({
      id: event.id,
      authorPubkeyHex: event.pubkey,
      caption: event.content,
      createdAt: event.created_at,
      expiresAt,
      media,
    });
  },

  parseFirstImageMedia(
    tags: readonly (readonly string[])[],
    topLevelMime?: string,
  ): StoryMedia | null {
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
        guessStoryImageMimeFromUrl(fields.url),
      ];
      let mimeType: string | undefined;
      for (const candidate of mimeCandidates) {
        if (candidate && isStoryImageMimeType(candidate)) {
          mimeType = normalizeStoryImageMimeType(candidate);
          break;
        }
      }
      if (!mimeType) {
        continue;
      }

      const dims = parseDim(fields.dim);
      const mediaResult = createStoryMedia({
        url: fields.url,
        mimeType,
        width: dims?.width,
        height: dims?.height,
        sha256: fields.x,
        alt: fields.alt,
      });
      if (mediaResult.ok) {
        return mediaResult.value;
      }
    }
    return null;
  },
} as const;

function parseImetaTag(tag: readonly string[]): ImetaFields {
  const fields: ImetaFields = {};
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
    if (key === 'url' || key === 'm' || key === 'dim' || key === 'alt' || key === 'x') {
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
