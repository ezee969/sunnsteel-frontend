import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import type { LoginResponse } from '../types/auth.type';
import { tokenService } from '../services/tokenService';

// Usage: const { mutate: googleLogin } = useGoogleLogin();
// googleLogin(idToken);
export const useGoogleLogin = () => {
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, Error, string>({
    mutationFn: (idToken: string) => authService.googleLogin({ idToken }),

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
