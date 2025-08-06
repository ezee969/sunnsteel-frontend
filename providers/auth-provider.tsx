import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/api/services/authService';
import { useRefreshToken } from '@/lib/api/hooks/useRefreshToken';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: false,
  error: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [refreshAttempted, setRefreshAttempted] = useState(false);

  const {
    mutate: refreshToken,
    isPending: refreshing,
    isError: refreshError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    error: refreshErrorDetails,
  } = useRefreshToken();

  // Handle token refresh when needed
  useEffect(() => {
    // Only try to refresh if:
    // 1. We haven't already tried
    // 2. We don't have an access token
    // 3. We're not currently refreshing
    if (refreshAttempted || authService.isAuthenticated() || refreshing) {
      return;
    }

    console.log('Attempting token refresh...');

    refreshToken(undefined, {
      onSuccess: () => {
        console.log('Token refresh successful');
        // Simply invalidate user queries to trigger refetch if needed
        queryClient.invalidateQueries({ queryKey: ['user'] });
      },
      onError: (error) => {
        console.error('Token refresh failed:', error);
      },
      onSettled: () => {
        setRefreshAttempted(true);
      },
    });
  }, [refreshToken, refreshAttempted, refreshing, queryClient]);

  // Authentication is solely determined by token presence
  const isAuthenticated = authService.isAuthenticated();

  const value = {
    isAuthenticated,
    isLoading: refreshing,
    error: refreshError ? new Error('Authentication failed') : null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
