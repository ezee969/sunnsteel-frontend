import { useQuery } from '@tanstack/react-query';
import { PublicUserProfile } from '@sunsteel/contracts';
import { userService } from '@/lib/api/services/userService';
import { useAuth } from '@/providers/use-auth-adapter';

export function usePublicUser(userId: string) {
  const { isAuthenticated } = useAuth();

  return useQuery<PublicUserProfile, Error>({
    queryKey: ['users', 'public', userId],
    queryFn: () => userService.getUserById(userId),
    enabled: isAuthenticated && !!userId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
