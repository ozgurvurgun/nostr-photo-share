export class EventIdDeduper {
  private readonly seen = new Set<string>();

  constructor(private readonly maxSize = 5_000) {}

  take(key: string): boolean {
    if (this.seen.has(key)) {
      return false;
    }

    this.seen.add(key);
    if (this.seen.size > this.maxSize) {
      const oldest = this.seen.values().next().value;
      if (oldest !== undefined) {
        this.seen.delete(oldest);
      }
    }

    return true;
  }
}
