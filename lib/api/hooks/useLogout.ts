import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { tokenService } from '../services/tokenService';
import type { LogoutResponse } from '../types/auth.type';
import { useRouter } from 'next/navigation';

export const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<LogoutResponse, Error>({
    mutationFn: async () => {
      const response = await authService.logout();
      tokenService.clearAccessToken();
      return response;
    },
    onSuccess: () => {
      // Clear user data from cache and reset relevant queries
      queryClient.removeQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries();

      // Redirect to login page
      router.push('/login');
    },
  });
};
