import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { tokenService } from '../services/tokenService';
import type { RefreshResponse } from '../types/auth.type';

export const useRefreshToken = () => {
  return useMutation<RefreshResponse, Error>({
    mutationFn: async () => {
      const response = await authService.refreshToken();

      if (response && response.accessToken) {
        tokenService.setAccessToken(response.accessToken);
      }

      return response;
    },
  });
};
