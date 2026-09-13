import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useAppContainer} from '../../../../app/providers/AppContainerContext';
import type {Profile, ProfileUpdateInput} from '../../domain/Profile';
import {profileQueryKey} from '../profileQueryKeys';

export function useProfile(pubkeyHex: string | undefined) {
  const container = useAppContainer();
  const normalized = pubkeyHex?.trim().toLowerCase() ?? '';

  return useQuery({
    queryKey: profileQueryKey(normalized),
    enabled: normalized.length > 0,
    queryFn: async (): Promise<Profile> => {
      const result = await container.getProfile.execute(normalized);
      if (!result.ok) {
        const cached = container.getProfile.getCached(normalized);
        if (cached !== null) {
          return cached;
        }
        throw result.error;
      }
      return result.value;
    },
    staleTime: 30_000,
  });
}

export function useUpdateProfile() {
  const container = useAppContainer();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ProfileUpdateInput): Promise<Profile> => {
      const result = await container.updateProfile.execute(input);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
    onSuccess: profile => {
      queryClient.setQueryData(profileQueryKey(profile.pubkeyHex), profile);
      void queryClient.invalidateQueries({queryKey: profileQueryKey(profile.pubkeyHex)});
    },
  });
}
