import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useMemo} from 'react';
import {useAppContainer} from '../../../../app/providers/AppContainerContext';
import type {PublishStoryInput} from '../../application/PublishStoryUseCase';
import {
  groupStoriesByAuthor,
  type AuthorStoryStack,
} from '../../application/GetActiveStoriesUseCase';
import {isStoryExpired, type Story} from '../../domain/Story';
import {
  activeStoriesQueryKey,
  storyQueryKeyRoot,
  storySeenQueryKey,
} from '../storyQueryKeys';

const DEFAULT_LIMIT = 80;

export type ActiveStoriesData = {
  readonly stories: readonly Story[];
  readonly byAuthor: readonly AuthorStoryStack[];
  readonly fromCache: boolean;
};

export type UseActiveStoriesOptions = {
  readonly authors?: readonly string[];
  readonly enabled?: boolean;
  readonly limit?: number;
  /** When false, skip background polling (e.g. Home tab blurred). */
  readonly refetchIntervalMs?: number | false;
};

function filterActiveStories(data: ActiveStoriesData): ActiveStoriesData {
  const nowSec = Math.floor(Date.now() / 1000);
  const stories = data.stories.filter(story => !isStoryExpired(story, nowSec));
  return {
    stories,
    byAuthor: groupStoriesByAuthor(stories),
    fromCache: data.fromCache,
  };
}

export function useActiveStories(options: UseActiveStoriesOptions = {}) {
  const container = useAppContainer();
  const authors = options.authors;
  const enabled = options.enabled ?? true;
  const limit = options.limit ?? DEFAULT_LIMIT;
  const refetchIntervalMs = options.refetchIntervalMs ?? 30_000;
  const authorsKey =
    authors !== undefined && authors.length > 0 ? authors.join(',') : 'global';

  return useQuery({
    queryKey: activeStoriesQueryKey(authorsKey),
    enabled,
    queryFn: async (): Promise<ActiveStoriesData> => {
      const result = await container.getActiveStories.execute({
        limit,
        ...(authors !== undefined && authors.length > 0 ? {authors} : {}),
      });
      if (!result.ok) {
        throw result.error;
      }
      return {
        stories: result.value.stories,
        byAuthor: result.value.byAuthor,
        fromCache: result.value.fromCache,
      };
    },
    select: filterActiveStories,
    staleTime: 15_000,
    refetchInterval: refetchIntervalMs,
  });
}

export function usePublishStory() {
  const container = useAppContainer();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PublishStoryInput): Promise<Story> => {
      const result = await container.publishStory.execute(input);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: storyQueryKeyRoot}).catch(() => undefined);
    },
  });
}

export function useStorySeenIds(): ReadonlySet<string> {
  const container = useAppContainer();
  const query = useQuery({
    queryKey: storySeenQueryKey(),
    queryFn: (): string[] => [...container.storySeenStore.getSeenIds()],
    staleTime: Infinity,
  });
  return useMemo(() => {
    const ids = query.data ?? [...container.storySeenStore.getSeenIds()];
    return new Set(ids);
  }, [container.storySeenStore, query.data]);
}

export function useMarkStorySeen() {
  const container = useAppContainer();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storyId: string): Promise<void> => {
      container.markStorySeen.execute(storyId);
    },
    onSuccess: () => {
      queryClient.setQueryData(storySeenQueryKey(), [
        ...container.storySeenStore.getSeenIds(),
      ]);
    },
  });
}

export function authorStackHasUnseen(
  stack: AuthorStoryStack,
  seenIds: ReadonlySet<string>,
): boolean {
  return stack.stories.some(story => !seenIds.has(story.id));
}
