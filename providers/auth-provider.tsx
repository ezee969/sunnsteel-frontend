import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/api/services/authService';
import { useRefreshToken } from '@/lib/api/hooks/useRefreshToken';
import { usePathname } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  hasTriedRefresh: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: false,
  error: null,
  hasTriedRefresh: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [refreshAttempted, setRefreshAttempted] = useState(() =>
    authService.isAuthenticated()
  );
  const pathname = usePathname();

  const {
    mutate: refreshToken,
    isPending: refreshing,
    isError: refreshError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    error: refreshErrorDetails,
  } = useRefreshToken();

  // Handle token refresh when needed
  useEffect(() => {
    const isAuthPage = pathname === '/login' || pathname === '/signup';
    // Only try to refresh if:
    // 1. We haven't already tried
    // 2. We don't have an access token
    // 3. We're not currently refreshing
    // 4. We are not on an auth page (avoid noise on /login and /signup)
    if (
      refreshAttempted ||
      authService.isAuthenticated() ||
      refreshing ||
      isAuthPage
    ) {
      return;
    }

    refreshToken(undefined, {
      onSuccess: () => {
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
  }, [refreshToken, refreshAttempted, refreshing, queryClient, pathname]);

  // Authentication is solely determined by token presence
  const isAuthenticated = authService.isAuthenticated();

  // If we already have an access token, consider the refresh attempt complete
  // to avoid protected layout waiting forever on first render after login.
  useEffect(() => {
    if (isAuthenticated && !refreshAttempted) {
      setRefreshAttempted(true);
    }
  }, [isAuthenticated, refreshAttempted]);

  const value = {
    isAuthenticated,
    // During SSR, always return false for isLoading to prevent hydration mismatch
    isLoading: typeof window === 'undefined' ? false : refreshing,
    error: refreshError ? new Error('Authentication failed') : null,
    hasTriedRefresh: refreshAttempted,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
