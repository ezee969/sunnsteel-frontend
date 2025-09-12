import { useQuery } from '@tanstack/react-query';
import { userService } from '@/lib/api/services/userService';
import { User } from '@/lib/api/types/auth.type';
import { useAuth } from '@/providers/auth-provider';

export function useUser() {
  const { isAuthenticated, hasTriedRefresh } = useAuth();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery<User, Error>({
    queryKey: ['user', 'profile'],
    queryFn: () => userService.getProfile(),
    enabled: isAuthenticated && hasTriedRefresh, // Fetch only after refresh logic settled
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
