import { useQuery } from '@tanstack/react-query';
import { userService } from '@/lib/api/services/userService';
import { User } from '@/lib/api/types/auth.type';
import { useSupabaseAuth } from '@/providers/supabase-auth-provider';

export function useUser() {
  const { session, isLoading: isLoadingSupabase } = useSupabaseAuth();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery<User, Error>({
    queryKey: ['user'],
    queryFn: () => userService.getProfile(),
    enabled: !isLoadingSupabase && !!session,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
  // During SSR, always return false for isLoading to prevent hydration mismatch
  const safeIsLoading = typeof window === 'undefined' ? false : isLoading;

  return {
    user,
    isLoading: safeIsLoading,
    error,
    refetch,
  };
}
