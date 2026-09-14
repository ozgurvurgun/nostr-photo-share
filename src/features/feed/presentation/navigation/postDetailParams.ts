import type {AppStackParamList} from '../../../../app/navigation/types';
import {ImagePost} from '../../domain/ImagePost';

/** Build PostDetail route params with a media snapshot for Instagram-like open. */
export function postDetailParamsFromPost(
  post: ImagePost,
  extras?: {readonly openComments?: boolean; readonly authorFeed?: boolean},
): AppStackParamList['PostDetail'] {
  return {
    eventId: post.id,
    authorPubkeyHex: post.authorPubkeyHex,
    mediaUrl: post.media.url,
    blurhash: post.media.blurhash,
    mediaAlt: post.media.alt,
    title: post.title,
    caption: post.caption,
    aspectRatio: post.aspectRatio,
    createdAt: post.createdAt,
    ...(extras?.openComments ? {openComments: true} : {}),
    ...(extras?.authorFeed ? {authorFeed: true} : {}),
  };
}

/** Rebuild a display ImagePost from PostDetail nav params (presentation-only snapshot). */
export function imagePostFromDetailParams(
  params: AppStackParamList['PostDetail'],
): ImagePost | null {
  const mediaUrl = params.mediaUrl?.trim() ?? '';
  if (mediaUrl.length === 0) {
    return null;
  }

  const aspectRatio = params.aspectRatio;
  const width =
    aspectRatio !== undefined && aspectRatio > 0
      ? Math.max(1, Math.round(aspectRatio * 1000))
      : undefined;
  const height = width !== undefined ? 1000 : undefined;

  const result = ImagePost.create({
    id: params.eventId,
    authorPubkeyHex: params.authorPubkeyHex,
    title: (params.title ?? '').trim() || 'Post',
    caption: params.caption ?? '',
    createdAt: params.createdAt ?? Math.floor(Date.now() / 1000),
    media: {
      url: mediaUrl,
      mimeType: 'image/jpeg',
      alt: params.mediaAlt,
      blurhash: params.blurhash,
      fallbackUrls: [],
      ...(width !== undefined && height !== undefined ? {width, height} : {}),
    },
  });

  return result.ok ? result.value : null;
}
