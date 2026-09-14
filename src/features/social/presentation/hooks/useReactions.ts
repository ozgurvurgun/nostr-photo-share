import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useEffect, useMemo, useRef} from 'react';
import {useAppContainer} from '../../../../app/providers/AppContainerContext';
import {useAuthSession} from '../../../auth/presentation/hooks/useAuthSession';
import {
  emptyReactionSummary,
  type Reaction,
  type ReactionSummary,
} from '../../domain/Reaction';
import {
  reactionQueryKey,
  reactionsFeedBatchQueryKey,
  socialQueryKeyRoot,
} from '../socialQueryKeys';

export type ReactionsBatchData = {
  readonly byEventId: Readonly<Record<string, ReactionSummary>>;
  readonly fromCache: boolean;
};

export type ReactionQueryData = {
  readonly summary: ReactionSummary;
  readonly fromCache: boolean;
};

/**
 * Loads NIP-25 like summaries for feed posts.
 * Uses one stable cache key and only fetches ids that are not yet in the batch
 * (avoids full refetch when the feed paginates).
 */
export function usePostReactions(eventIds: readonly string[]) {
  const container = useAppContainer();
  const queryClient = useQueryClient();
  const {identity} = useAuthSession();
  const viewer = identity?.publicKey.toHex() ?? null;
  const ids = useMemo(
    () => [...new Set(eventIds.map(id => id.trim().toLowerCase()).filter(Boolean))],
    [eventIds],
  );
  const idsRef = useRef(ids);
  idsRef.current = ids;

  const query = useQuery({
    queryKey: reactionsFeedBatchQueryKey,
    enabled: ids.length > 0,
    queryFn: async (): Promise<ReactionsBatchData> => {
      const currentIds = idsRef.current;
      const previous = queryClient.getQueryData<ReactionsBatchData>(
        reactionsFeedBatchQueryKey,
      );
      const known: Record<string, ReactionSummary> = {
        ...(previous?.byEventId ?? {}),
      };
      const missing = currentIds.filter(id => known[id] === undefined);

      let fromCache = previous?.fromCache ?? true;
      if (missing.length > 0) {
        const result = await container.getPostReactions.execute(missing, viewer);
        if (!result.ok) {
          for (const eventId of missing) {
            known[eventId] = container.getPostReactions.getCached(eventId);
          }
          fromCache = true;
        } else {
          fromCache = result.value.fromCache && (previous?.fromCache ?? true);
          for (const summary of result.value.summaries) {
            known[summary.targetEventId] = summary;
          }
          for (const eventId of missing) {
            if (known[eventId] === undefined) {
              known[eventId] = emptyReactionSummary(eventId);
            }
          }
        }
      }

      return {byEventId: known, fromCache};
    },
    staleTime: 45_000,
  });

  const missingCount = useMemo(() => {
    const known = query.data?.byEventId;
    if (!known) {
      return ids.length;
    }
    return ids.reduce((count, id) => (known[id] === undefined ? count + 1 : count), 0);
  }, [ids, query.data?.byEventId]);

  const {refetch, isFetching} = query;

  useEffect(() => {
    if (ids.length === 0 || missingCount === 0 || isFetching) {
      return;
    }
    refetch().catch(() => undefined);
  }, [ids.length, missingCount, isFetching, refetch]);

  const byEventId = useMemo(() => {
    const map = new Map<string, ReactionSummary>();
    const data = query.data?.byEventId;
    for (const eventId of ids) {
      map.set(eventId, data?.[eventId] ?? emptyReactionSummary(eventId));
    }
    return map;
  }, [ids, query.data?.byEventId]);

  return {
    byEventId,
    fromCache: query.data?.fromCache === true,
    isPending: query.isPending,
    isError: query.isError,
  };
}

function patchReactionInBatch(
  old: ReactionsBatchData | undefined,
  eventId: string,
  patch: (baseline: ReactionSummary) => ReactionSummary,
): ReactionsBatchData | undefined {
  if (!old) {
    return old;
  }
  const key = eventId.trim().toLowerCase();
  const baseline = old.byEventId[key] ?? emptyReactionSummary(key);
  return {
    ...old,
    byEventId: {
      ...old.byEventId,
      [key]: patch(baseline),
    },
  };
}

export function useLikePost() {
  const container = useAppContainer();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      eventId: string;
      authorPubkeyHex: string;
    }): Promise<Reaction> => {
      const result = await container.likePost.execute(input);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
    onMutate: async input => {
      const eventId = input.eventId.trim().toLowerCase();
      const batchRoot = [...socialQueryKeyRoot, 'reactions'] as const;
      const singleKey = reactionQueryKey(eventId);

      await queryClient.cancelQueries({queryKey: batchRoot});
      await queryClient.cancelQueries({queryKey: singleKey});

      const previousBatches = queryClient.getQueriesData<ReactionsBatchData>({
        queryKey: batchRoot,
      });
      const previousSingle = queryClient.getQueryData<ReactionQueryData>(singleKey);

      queryClient.setQueriesData<ReactionsBatchData>({queryKey: batchRoot}, old =>
        patchReactionInBatch(old, eventId, baseline => {
          if (baseline.likedByMe) {
            return baseline;
          }
          return {
            ...baseline,
            likeCount: baseline.likeCount + 1,
            likedByMe: true,
            myReactionId: 'optimistic',
          };
        }),
      );

      const singleBaseline = previousSingle?.summary ?? emptyReactionSummary(eventId);
      if (!singleBaseline.likedByMe) {
        queryClient.setQueryData<ReactionQueryData>(singleKey, {
          summary: {
            ...singleBaseline,
            likeCount: singleBaseline.likeCount + 1,
            likedByMe: true,
            myReactionId: 'optimistic',
          },
          fromCache: previousSingle?.fromCache ?? false,
        });
      }

      return {previousBatches, previousSingle, singleKey, batchRoot};
    },
    onError: (_error, _input, context) => {
      if (!context) {
        return;
      }
      for (const [key, data] of context.previousBatches) {
        queryClient.setQueryData(key, data);
      }
      if (context.previousSingle !== undefined) {
        queryClient.setQueryData(context.singleKey, context.previousSingle);
      } else {
        queryClient.removeQueries({queryKey: context.singleKey});
      }
    },
    onSuccess: (reaction, input) => {
      const eventId = input.eventId.trim().toLowerCase();
      const batchRoot = [...socialQueryKeyRoot, 'reactions'] as const;
      const singleKey = reactionQueryKey(eventId);

      queryClient.setQueriesData<ReactionsBatchData>({queryKey: batchRoot}, old =>
        patchReactionInBatch(old, eventId, baseline => ({
          targetEventId: eventId,
          likeCount: Math.max(baseline.likeCount, 1),
          likedByMe: true,
          myReactionId: reaction.id,
        })),
      );

      const previous = queryClient.getQueryData<ReactionQueryData>(singleKey);
      queryClient.setQueryData<ReactionQueryData>(singleKey, {
        summary: {
          targetEventId: eventId,
          likeCount: Math.max(previous?.summary.likeCount ?? 1, 1),
          likedByMe: true,
          myReactionId: reaction.id,
        },
        fromCache: false,
      });
    },
  });
}
