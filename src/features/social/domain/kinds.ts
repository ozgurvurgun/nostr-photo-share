/** NIP-02 contact list. */
export const FOLLOW_LIST_KIND = 3 as const;

/** NIP-25 reaction. */
export const REACTION_KIND = 7 as const;

/** NIP-22 comment. */
export const COMMENT_KIND = 1111 as const;

/** Like reaction content (NIP-25). Empty string is also a like. */
export const LIKE_CONTENT = '+' as const;

export function isLikeContent(content: string): boolean {
  const trimmed = content.trim();
  return trimmed === '' || trimmed === LIKE_CONTENT;
}
