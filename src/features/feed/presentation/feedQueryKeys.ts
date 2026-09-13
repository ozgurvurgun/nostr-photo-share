export const feedQueryKeyRoot = ['feed'] as const;

export function feedInfiniteQueryKey() {
  return [...feedQueryKeyRoot, 'infinite'] as const;
}
