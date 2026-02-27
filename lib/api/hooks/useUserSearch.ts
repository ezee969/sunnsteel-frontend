import { useQuery } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { useAuth } from '@/providers/use-auth-adapter';

export const useUserSearch = (query: string, limit: number = 5) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['users', 'search', query, limit],
    queryFn: async () => {
      if (!query || query.trim().length < 2) return [];
      return userService.searchUsers(query, limit);
    },
    enabled: isAuthenticated && !!query && query.trim().length >= 2,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1
  });
};
