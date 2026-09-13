import type {Story} from '../domain/Story';
import {isStoryExpired} from '../domain/Story';
import type {CachedStoriesSnapshot, IStoryCache} from '../application/ports/IStoryCache';

function compareStoriesNewestFirst(a: Story, b: Story): number {
  if (a.createdAt !== b.createdAt) {
    return b.createdAt - a.createdAt;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function purgeExpired(
  stories: readonly Story[],
  nowSec = Math.floor(Date.now() / 1000),
): Story[] {
  return stories.filter(story => !isStoryExpired(story, nowSec));
}

export class InMemoryStoryCache implements IStoryCache {
  private snapshot: CachedStoriesSnapshot | null = null;

  get(): CachedStoriesSnapshot | null {
    if (this.snapshot === null) {
      return null;
    }
    const active = purgeExpired(this.snapshot.stories);
    if (active.length !== this.snapshot.stories.length) {
      this.snapshot = {
        stories: active,
        updatedAt: Date.now(),
      };
    }
    return this.snapshot;
  }

  merge(stories: readonly Story[]): CachedStoriesSnapshot {
    const byId = new Map<string, Story>();
    if (this.snapshot !== null) {
      for (const story of this.snapshot.stories) {
        byId.set(story.id, story);
      }
    }
    for (const story of stories) {
      byId.set(story.id, story);
    }
    const merged = purgeExpired([...byId.values()]).sort(compareStoriesNewestFirst);
    this.snapshot = {
      stories: merged,
      updatedAt: Date.now(),
    };
    return this.snapshot;
  }

  clear(): void {
    this.snapshot = null;
  }
}
