import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useAppContainer} from '../../../../app/providers/AppContainerContext';
import type {RelayPreference} from '../../domain/RelayPreference';
import {relayHealthQueryKey, relayListQueryKey, relayQueryKeyRoot} from '../relayQueryKeys';

export function useRelayList(ownerPubkeyHex: string | undefined) {
  const container = useAppContainer();
  return useQuery({
    queryKey: relayListQueryKey(ownerPubkeyHex ?? ''),
    enabled: Boolean(ownerPubkeyHex && ownerPubkeyHex.length > 0),
    queryFn: async () => {
      const result = await container.getRelayList.execute(ownerPubkeyHex!);
      if (!result.ok) {
        throw result.error;
      }
      // Apply pool sync when fetch succeeds (session hydrate + screen open).
      await container.applyRelayListToPool.execute(result.value);
      return result.value;
    },
  });
}

export function useRelayHealth(ownerPubkeyHex: string | undefined, pollMs = 2_000) {
  const container = useAppContainer();
  return useQuery({
    queryKey: relayHealthQueryKey(ownerPubkeyHex ?? ''),
    enabled: Boolean(ownerPubkeyHex && ownerPubkeyHex.length > 0),
    refetchInterval: pollMs,
    queryFn: () => container.getRelayHealth.execute(ownerPubkeyHex),
  });
}

export function useUpdateRelayList() {
  const container = useAppContainer();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: readonly RelayPreference[]) => {
      const result = await container.updateRelayList.execute({preferences});
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
    onSuccess: list => {
      void queryClient.invalidateQueries({queryKey: relayQueryKeyRoot});
      queryClient.setQueryData(relayListQueryKey(list.ownerPubkeyHex), list);
    },
  });
}
