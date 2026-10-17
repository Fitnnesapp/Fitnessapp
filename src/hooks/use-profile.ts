import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth/auth-provider';
import type { ConsentValues } from '@/lib/logic/consent';
import { completeConsent, fetchProfile, setConsent } from '@/lib/supabase/profiles';
import type { ConsentKey } from '@/types/database';

export const profileQueryKey = (userId: string | undefined) => ['profile', userId] as const;

export function useProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: profileQueryKey(userId),
    queryFn: () => fetchProfile(userId as string),
    enabled: Boolean(userId),
  });
}

export function useCompleteConsent() {
  const userId = useAuth().session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ConsentValues) => completeConsent(userId as string, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileQueryKey(userId) }),
  });
}

export function useSetConsent() {
  const userId = useAuth().session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, granted }: { key: ConsentKey; granted: boolean }) =>
      setConsent(userId as string, key, granted),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileQueryKey(userId) }),
  });
}
