import type {SignableEvent} from '../../auth/application/ports/ISigner';
import type {StoryMedia} from '../domain/Story';
import {STORY_KIND} from '../domain/StoryKind';

export type Kind20StoryDraftInput = {
  readonly title: string;
  readonly caption: string;
  readonly media: StoryMedia;
  readonly createdAt: number;
  readonly expiresAt: number;
};

/**
 * Builds an unsigned NIP-68 kind:20 picture event used as a story slide.
 * NIP-40 `expiration` distinguishes it from durable feed posts.
 * V1: single image imeta only (no video).
 */
export function buildKind20StoryUnsignedEvent(input: Kind20StoryDraftInput): SignableEvent {
  const title = input.title.trim() || 'Story';
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
  if (input.media.sha256) {
    imeta.push(`x ${input.media.sha256}`);
  }

  const tags: (readonly string[])[] = [
    ['title', title],
    imeta,
    ['m', input.media.mimeType],
    ['expiration', String(Math.floor(input.expiresAt))],
  ];
  if (input.media.sha256) {
    tags.push(['x', input.media.sha256]);
  }

  return {
    kind: STORY_KIND,
    created_at: Math.floor(input.createdAt),
    tags,
    content: input.caption,
  };
}

/** NIP-68 title from optional caption (stories may have empty content). */
export function storyTitleFromCaption(caption: string): string {
  const trimmed = caption.trim();
  if (trimmed.length === 0) {
    return 'Story';
  }
  if (trimmed.length <= 80) {
    return trimmed;
  }
  return `${trimmed.slice(0, 77)}...`;
}
