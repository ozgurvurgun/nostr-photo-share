export const profileQueryKeyRoot = ['profile'] as const;

export const profileQueryKey = (pubkeyHex: string): readonly ['profile', string] =>
  ['profile', pubkeyHex.trim().toLowerCase()] as const;
