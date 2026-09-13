/**
 * Local seen-state for story rings. Implementations may persist across restarts.
 */
export interface IStorySeenStore {
  hasSeen(storyId: string): boolean;
  markSeen(storyId: string): void;
  /** All story ids currently marked seen. */
  getSeenIds(): ReadonlySet<string>;
  clear(): void;
  /** Optional async hydrate for persistent stores (call once at bootstrap). */
  hydrate?(): Promise<void>;
}
