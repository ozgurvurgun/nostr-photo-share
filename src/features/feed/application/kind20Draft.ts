import type {SignableEvent} from '../../auth/application/ports/ISigner';
import type {ImagePostMedia} from '../domain/ImagePost';
import {PICTURE_EVENT_KIND} from '../domain/PictureKind';

export type Kind20DraftInput = {
  readonly title: string;
  readonly caption: string;
  readonly media: ImagePostMedia;
  readonly createdAt?: number;
};

/**
 * Builds an unsigned NIP-68 kind:20 event (single imeta — V1).
 * Application-layer only; no relay/network imports.
 */
export function buildKind20UnsignedEvent(input: Kind20DraftInput): SignableEvent {
  const imeta: string[] = [
    'imeta',
    `url ${input.media.url}`,
    `m ${input.media.mimeType}`,
  ];

  if (input.media.width !== undefined && input.media.height !== undefined) {
    imeta.push(`dim ${Math.round(input.media.width)}x${Math.round(input.media.height)}`);
  }
  if (input.media.alt) {
    imeta.push(`alt ${input.media.alt}`);
  }
  if (input.media.blurhash) {
    imeta.push(`blurhash ${input.media.blurhash}`);
  }
  if (input.media.sha256) {
    imeta.push(`x ${input.media.sha256}`);
  }
  for (const fallback of input.media.fallbackUrls) {
    imeta.push(`fallback ${fallback}`);
  }

  const tags: (readonly string[])[] = [['title', input.title], imeta, ['m', input.media.mimeType]];
  if (input.media.sha256) {
    tags.push(['x', input.media.sha256]);
  }

  return {
    kind: PICTURE_EVENT_KIND,
    created_at: input.createdAt ?? Math.floor(Date.now() / 1000),
    tags,
    content: input.caption,
  };
}
