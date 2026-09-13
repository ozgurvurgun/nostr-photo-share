import {useInfiniteQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useAppContainer} from '../../../../app/providers/AppContainerContext';
import type {ImagePost} from '../../domain/ImagePost';
import type {PublishImagePostInput} from '../../application/PublishImagePostUseCase';
import {feedInfiniteQueryKey} from '../feedQueryKeys';

const DEFAULT_PAGE_SIZE = 20;

export type FeedPageData = {
  readonly posts: readonly ImagePost[];
  readonly nextUntil: number | null;
  readonly fromCache: boolean;
};

export type UseFeedOptions = {
  readonly pageSize?: number;
  /** When non-empty, restrict feed to these authors (follow graph + self). */
  readonly authors?: readonly string[];
  /** Gate queries until follow list (or other deps) are ready. */
  readonly enabled?: boolean;
};

export function useFeed(options: UseFeedOptions = {}) {
  const container = useAppContainer();
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const authors = options.authors;
  const enabled = options.enabled ?? true;

  return useInfiniteQuery({
    queryKey: [...feedInfiniteQueryKey(), authors?.join(',') ?? 'global'] as const,
    enabled,
    initialPageParam: undefined as number | undefined,
    queryFn: async ({pageParam}): Promise<FeedPageData> => {
      const result = await container.getFeedPage.execute({
        until: pageParam,
        limit: pageSize,
        ...(authors !== undefined && authors.length > 0 ? {authors} : {}),
      });
      if (!result.ok) {
        throw result.error;
      }
      return {
        posts: result.value.posts,
        nextUntil: result.value.nextUntil,
        fromCache: result.value.fromCache,
      };
    },
    getNextPageParam: lastPage => lastPage.nextUntil ?? undefined,
    staleTime: 15_000,
  });
}

export function usePublishImagePost() {
  const container = useAppContainer();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PublishImagePostInput): Promise<ImagePost> => {
      const result = await container.publishImagePost.execute(input);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: feedInfiniteQueryKey()});
    },
  });
}

export function flattenFeedPosts(pages: readonly FeedPageData[] | undefined): ImagePost[] {
  if (!pages) {
    return [];
  }
  const byId = new Map<string, ImagePost>();
  for (const page of pages) {
    for (const post of page.posts) {
      byId.set(post.id, post);
    }
  }
  return [...byId.values()].sort((a, b) => {
    if (a.createdAt !== b.createdAt) {
      return b.createdAt - a.createdAt;
    }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}
