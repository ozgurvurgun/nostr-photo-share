import {ok, type Result} from '../../../core/result/Result';
import type {IStorySeenStore} from './ports/IStorySeenStore';

/**
 * Marks a story as seen in the local in-memory store (V1 ring state).
 */
export class MarkStorySeenUseCase {
  constructor(private readonly seenStore: IStorySeenStore) {}

  execute(storyId: string): Result<void, never> {
    const normalized = storyId.trim().toLowerCase();
    if (normalized.length > 0) {
      this.seenStore.markSeen(normalized);
    }
    return ok(undefined);
  }

  hasSeen(storyId: string): boolean {
    return this.seenStore.hasSeen(storyId.trim().toLowerCase());
  }
}
