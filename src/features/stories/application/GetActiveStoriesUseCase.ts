import {ok, type Result} from '../../../core/result/Result';
import type {StoryFetchError} from '../domain/errors';
import {isStoryExpired, type Story} from '../domain/Story';
import type {IStoryCache} from './ports/IStoryCache';
import type {ActiveStoriesQuery, IStoryRepository} from './ports/IStoryRepository';

export type AuthorStoryStack = {
  readonly authorPubkeyHex: string;
  readonly stories: readonly Story[];
};

export type GetActiveStoriesResult = {
  readonly stories: readonly Story[];
  readonly byAuthor: readonly AuthorStoryStack[];
  /** True when the page came from cache after a fetch failure. */
  readonly fromCache: boolean;
};

export type GetActiveStoriesInput = ActiveStoriesQuery & {
  /** Unix seconds; defaults to now. Used for client-side expiration filter. */
  readonly nowSec?: number;
};

/**
 * Loads active stories (kind:20 + NIP-40 expiration), filters expired client-side,
 * groups by author, caches. Expired story ≠ deleted relay event — never rely on relay deletion.
 */
export class GetActiveStoriesUseCase {
  constructor(
    private readonly repository: IStoryRepository,
    private readonly cache: IStoryCache,
  ) {}

  async execute(
    query: GetActiveStoriesInput,
  ): Promise<Result<GetActiveStoriesResult, StoryFetchError>> {
    const nowSec = query.nowSec ?? Math.floor(Date.now() / 1000);
    const fetchResult = await this.repository.fetchActive({
      limit: query.limit,
      ...(query.authors !== undefined ? {authors: query.authors} : {}),
    });

    if (!fetchResult.ok) {
      const cached = this.cache.get();
      if (cached !== null && cached.stories.length > 0) {
        const active = filterActive(cached.stories, query, nowSec);
        return ok({
          stories: active,
          byAuthor: groupByAuthor(active),
          fromCache: true,
        });
      }
      return fetchResult;
    }

    const active = filterActive(fetchResult.value, query, nowSec);
    this.cache.merge(active);

    return ok({
      stories: active,
      byAuthor: groupByAuthor(active),
      fromCache: false,
    });
  }

  getCachedActive(nowSec: number = Math.floor(Date.now() / 1000)): readonly Story[] {
    const cached = this.cache.get();
    if (cached === null) {
      return [];
    }
    return cached.stories.filter(story => !isStoryExpired(story, nowSec));
  }
}

function filterActive(
  stories: readonly Story[],
  query: ActiveStoriesQuery,
  nowSec: number,
): Story[] {
  let filtered = stories.filter(story => !isStoryExpired(story, nowSec));
  if (query.authors !== undefined && query.authors.length > 0) {
    const allowed = new Set(query.authors.map(a => a.trim().toLowerCase()));
    filtered = filtered.filter(story => allowed.has(story.authorPubkeyHex));
  }
  return [...filtered].sort(compareStoriesNewestFirst).slice(0, Math.max(1, query.limit));
}

function groupByAuthor(stories: readonly Story[]): AuthorStoryStack[] {
  const order: string[] = [];
  const map = new Map<string, Story[]>();
  for (const story of stories) {
    const existing = map.get(story.authorPubkeyHex);
    if (existing === undefined) {
      map.set(story.authorPubkeyHex, [story]);
      order.push(story.authorPubkeyHex);
    } else {
      existing.push(story);
    }
  }
  return order.map(authorPubkeyHex => ({
    authorPubkeyHex,
    stories: (map.get(authorPubkeyHex) ?? []).sort(compareStoriesNewestFirst),
  }));
}

/** Groups active stories by author (newest-first within each stack). */
export function groupStoriesByAuthor(stories: readonly Story[]): AuthorStoryStack[] {
  return groupByAuthor(stories);
}

function compareStoriesNewestFirst(a: Story, b: Story): number {
  if (a.createdAt !== b.createdAt) {
    return b.createdAt - a.createdAt;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}
