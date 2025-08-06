import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import type { RegisterCredentials, RegisterResponse } from '../types/auth.type';
import { useRouter } from 'next/navigation';

export const useRegister = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<RegisterResponse, Error, RegisterCredentials>({
    mutationFn: async (userData) => {
      const response = await authService.register(userData);
      return response;
    },
    onSuccess: (data) => {
      // After successful registration, update the cache with user data
      queryClient.setQueryData(['user', 'profile'], data.user);

      // Mark other user-related queries as stale
      queryClient.invalidateQueries({
        queryKey: ['user'],
        // Don't invalidate the profile we just set
        predicate: (query) =>
          query.queryKey.length !== 2 || query.queryKey[1] !== 'profile',
      });

      router.push('/login');
    },
  });
};
