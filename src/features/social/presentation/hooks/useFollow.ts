import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useAppContainer} from '../../../../app/providers/AppContainerContext';
import {useAuthSession} from '../../../auth/presentation/hooks/useAuthSession';
import type {FollowList} from '../../domain/FollowList';
import {feedInfiniteQueryKey} from '../../../feed/presentation/feedQueryKeys';
import {followListQueryKey} from '../socialQueryKeys';

export function useFollowList(ownerPubkeyHex?: string) {
  const container = useAppContainer();
  const {identity} = useAuthSession();
  const owner =
    (ownerPubkeyHex ?? identity?.publicKey.toHex() ?? '').trim().toLowerCase();

  return useQuery({
    queryKey: followListQueryKey(owner),
    enabled: owner.length > 0,
    queryFn: async (): Promise<FollowList> => {
      const result = await container.getFollowList.execute(owner);
      if (!result.ok) {
        const cached = container.getFollowList.getCached(owner);
        if (cached !== null) {
          return cached;
        }
        throw result.error;
      }
      return result.value;
    },
    staleTime: 60_000,
  });
}

export function useToggleFollow(targetPubkeyHex: string) {
  const container = useAppContainer();
  const queryClient = useQueryClient();
  const {identity} = useAuthSession();
  const ownerPubkeyHex = identity?.publicKey.toHex().trim().toLowerCase() ?? '';
  const target = targetPubkeyHex.trim().toLowerCase();

  return useMutation({
    mutationKey: ['toggleFollow', ownerPubkeyHex, target],
    mutationFn: async (shouldFollow: boolean): Promise<FollowList> => {
      const result = shouldFollow
        ? await container.followUser.execute({targetPubkeyHex: target})
        : await container.unfollowUser.execute(target);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
    onMutate: async shouldFollow => {
      const key = followListQueryKey(ownerPubkeyHex);
      await queryClient.cancelQueries({queryKey: key});
      const previous = queryClient.getQueryData<FollowList>(key);
      if (previous) {
        const optimistic = shouldFollow
          ? previous.withFollow({pubkeyHex: target})
          : previous.withoutFollow(target);
        if (optimistic.ok) {
          queryClient.setQueryData(key, optimistic.value);
        }
      }
      return {previous};
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(followListQueryKey(ownerPubkeyHex), context.previous);
      }
    },
    onSuccess: list => {
      queryClient.setQueryData(followListQueryKey(ownerPubkeyHex), list);
      void queryClient.invalidateQueries({queryKey: feedInfiniteQueryKey()});
    },
  });
}
