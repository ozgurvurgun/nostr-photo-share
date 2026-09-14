export const socialQueryKeyRoot = ['social'] as const;

export const followListQueryKey = (ownerPubkeyHex: string) =>
  [...socialQueryKeyRoot, 'followList', ownerPubkeyHex.trim().toLowerCase()] as const;

export const reactionsFeedBatchQueryKey = [
  ...socialQueryKeyRoot,
  'reactions',
  'feed',
] as const;

/** @deprecated Prefer reactionsFeedBatchQueryKey; kept for any single-shot callers. */
export const reactionsQueryKey = (eventIds: readonly string[]) =>
  [
    ...socialQueryKeyRoot,
    'reactions',
    [...eventIds].map(id => id.trim().toLowerCase()).sort().join(','),
  ] as const;

export const reactionQueryKey = (eventId: string) =>
  [...socialQueryKeyRoot, 'reaction', eventId.trim().toLowerCase()] as const;

export const commentsQueryKey = (rootEventId: string) =>
  [...socialQueryKeyRoot, 'comments', rootEventId.trim().toLowerCase()] as const;
