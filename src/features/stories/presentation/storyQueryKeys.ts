export const storyQueryKeyRoot = ['stories'] as const;

export function activeStoriesQueryKey(authorsKey: string = 'global') {
  return [...storyQueryKeyRoot, 'active', authorsKey] as const;
}

export function storySeenQueryKey() {
  return [...storyQueryKeyRoot, 'seen'] as const;
}
