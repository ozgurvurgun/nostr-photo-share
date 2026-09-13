export type NostrTag = readonly string[];

export type UnsignedNostrEvent = {
  readonly created_at: number;
  readonly kind: number;
  readonly tags: readonly NostrTag[];
  readonly content: string;
  readonly pubkey?: string;
};

export type SignedNostrEvent = {
  readonly id: string;
  readonly pubkey: string;
  readonly created_at: number;
  readonly kind: number;
  readonly tags: readonly NostrTag[];
  readonly content: string;
  readonly sig: string;
};
