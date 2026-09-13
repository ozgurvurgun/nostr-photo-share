import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useMemo} from 'react';
import {useAppContainer} from '../../../../app/providers/AppContainerContext';
import {useAuthSession} from '../../../auth/presentation/hooks/useAuthSession';
import {
  emptyReactionSummary,
  type Reaction,
  type ReactionSummary,
} from '../../domain/Reaction';
import {reactionQueryKey, reactionsQueryKey, socialQueryKeyRoot} from '../socialQueryKeys';

export type ReactionsBatchData = {
  readonly byEventId: Readonly<Record<string, ReactionSummary>>;
  readonly fromCache: boolean;
};

export type ReactionQueryData = {
  readonly summary: ReactionSummary;
  readonly fromCache: boolean;
};

/**
 * Loads NIP-25 like summaries for many posts in one relay round-trip.
 */
export function usePostReactions(eventIds: readonly string[]) {
  const container = useAppContainer();
  const {identity} = useAuthSession();
  const viewer = identity?.publicKey.toHex() ?? null;
  const ids = useMemo(
    () => [...new Set(eventIds.map(id => id.trim().toLowerCase()).filter(Boolean))],
    [eventIds],
  );

  const query = useQuery({
    queryKey: reactionsQueryKey(ids),
    enabled: ids.length > 0,
    queryFn: async (): Promise<ReactionsBatchData> => {
      const result = await container.getPostReactions.execute(ids, viewer);
      if (!result.ok) {
        const byEventId: Record<string, ReactionSummary> = {};
        for (const eventId of ids) {
          byEventId[eventId] = container.getPostReactions.getCached(eventId);
        }
        return {byEventId, fromCache: true};
      }
      const byEventId: Record<string, ReactionSummary> = {};
      for (const summary of result.value.summaries) {
        byEventId[summary.targetEventId] = summary;
      }
      for (const eventId of ids) {
        if (byEventId[eventId] === undefined) {
          byEventId[eventId] = emptyReactionSummary(eventId);
        }
      }
      return {byEventId, fromCache: result.value.fromCache};
    },
    staleTime: 20_000,
  });

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
