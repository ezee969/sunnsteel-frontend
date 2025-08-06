import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import type { LoginCredentials, LoginResponse } from '../types/auth.type';
import { tokenService } from '../services/tokenService';

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, Error, LoginCredentials>({
    mutationFn: (credentials) => authService.login(credentials),

    onSuccess: (data) => {
      // Store the access token
      tokenService.setAccessToken(data.accessToken);

      // Update cache with user data
      queryClient.setQueryData(['user', 'profile'], data.user);

      // Mark other user-related queries as stale
      queryClient.invalidateQueries({
        queryKey: ['user'],
        // Don't invalidate the profile we just set
        predicate: (query) =>
          query.queryKey.length !== 2 || query.queryKey[1] !== 'profile',
      });
    },
  });
};
