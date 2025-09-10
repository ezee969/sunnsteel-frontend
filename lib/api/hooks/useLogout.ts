import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { tokenService } from '../services/tokenService';
import type { LogoutResponse } from '../types/auth.type';
import { useRouter } from 'next/navigation';

export const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<LogoutResponse, Error>({
    onMutate: async () => {
      // Prevent any refresh attempts or secure calls during logout flow
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.setItem('authShuttingDown', '1');
        }
      } catch {}
      // Proactively stop any ongoing queries before the request
      await queryClient.cancelQueries({ predicate: () => true });
      queryClient.clear();
    },
    mutationFn: async () => {
      const response = await authService.logout();
      tokenService.clearAccessToken();
      return response;
    },
    onSuccess: () => {
      // Cancel any in-flight queries and clear the cache to avoid refetch churn
      queryClient.cancelQueries({ predicate: () => true });
      queryClient.clear();

      // Tell the login page to skip its one-time silent refresh this time
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.setItem('skipLoginSilentRefresh', '1');
        }
      } catch {}

      // Redirect to login page
      router.replace('/login');
    },
  });
};
