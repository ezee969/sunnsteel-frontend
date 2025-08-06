import { useQuery } from '@tanstack/react-query';
import { userService } from '@/lib/api/services/userService';
import { User } from '@/lib/api/types/auth.type';
import { useAuth } from '@/providers/auth-provider';

export function useUser() {
  const { isAuthenticated } = useAuth();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery<User, Error>({
    queryKey: ['user', 'profile'],
    queryFn: () => userService.getProfile(),
    enabled: isAuthenticated, // Only fetch when authenticated
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  return {
    user,
    isLoading,
    error,
    refetch,
  };
}
