/** Hard cap for a published NIP-65 list (guidance + sanity). */
export const MAX_RELAYS = 8 as const;

/** NIP-65 recommendation: keep 2-4 relays per read/write category. */
export const RECOMMENDED_RELAYS_MIN = 2 as const;
export const RECOMMENDED_RELAYS_MAX = 4 as const;
