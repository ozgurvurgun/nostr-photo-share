export type NostrFilter = {
  readonly ids?: readonly string[];
  readonly authors?: readonly string[];
  readonly kinds?: readonly number[];
  readonly since?: number;
  readonly until?: number;
  readonly limit?: number;
  readonly [tagFilter: `#${string}`]: readonly string[] | undefined;
};

export function toWireFilter(filter: NostrFilter): Record<string, unknown> {
  const wire: Record<string, unknown> = {};

  if (filter.ids !== undefined) {
    wire.ids = [...filter.ids];
  }
  if (filter.authors !== undefined) {
    wire.authors = [...filter.authors];
  }
  if (filter.kinds !== undefined) {
    wire.kinds = [...filter.kinds];
  }
  if (filter.since !== undefined) {
    wire.since = filter.since;
  }
  if (filter.until !== undefined) {
    wire.until = filter.until;
  }
  if (filter.limit !== undefined) {
    wire.limit = filter.limit;
  }

  for (const [key, value] of Object.entries(filter)) {
    if (key.startsWith('#') && Array.isArray(value)) {
      wire[key] = [...value];
    }
  }

  return wire;
}
