export const relayQueryKeyRoot = ['relays'] as const;

export function relayListQueryKey(ownerPubkeyHex: string) {
  return [...relayQueryKeyRoot, 'list', ownerPubkeyHex.trim().toLowerCase()] as const;
}

export function relayHealthQueryKey(ownerPubkeyHex: string) {
  return [...relayQueryKeyRoot, 'health', ownerPubkeyHex.trim().toLowerCase()] as const;
}
