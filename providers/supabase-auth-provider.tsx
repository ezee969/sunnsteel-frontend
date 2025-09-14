'use client';

import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabaseAuthService } from '@/lib/api/services/supabaseAuthService';
import { supabase } from '@/lib/supabase/client';
import { usePathname } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';

interface SupabaseAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: Session | null;
  user: any | null;
  error: Error | null;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  session: null,
  user: null,
  error: null,
});

export const SupabaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);

        if (session) {
          // Verify with backend and get user profile
          try {
            const userProfile = await supabaseAuthService.verifyToken(
              session.access_token
            );
            setUser(userProfile.user);
          } catch (err) {
            console.error('Failed to verify token with backend:', err);
            setError(err as Error);
          }
        }
      } catch (err) {
        console.error('Failed to get initial session:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      console.log('Session details:', {
        hasSession: !!session,
        accessToken: session?.access_token ? 'present' : 'missing',
        userId: session?.user?.id,
      });

      setSession(session);
      setError(null);

      if (session) {
        try {
          // Verify with backend and get/create user
          const userProfile = await supabaseAuthService.verifyToken(
            session.access_token
          );
          setUser(userProfile.user);

          // Invalidate queries to refetch with new auth state
          queryClient.invalidateQueries({ queryKey: ['user'] });
        } catch (err) {
          console.error('Failed to verify token with backend:', err);
          setError(err as Error);
          setUser(null);
        }
      } else {
        setUser(null);
        // Clear all cached data on sign out
        queryClient.clear();
        // Ensure any client-side session marker is cleared to avoid middleware/login loops
        try {
          if (typeof document !== 'undefined') {
            document.cookie = 'has_session=; Max-Age=0; path=/';
          }
        } catch {}
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Skip loading on auth pages to avoid redirect loops
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/auth/callback';
  const contextIsLoading = isAuthPage ? false : isLoading;

  const value = {
    isAuthenticated: !!session && !!user,
    isLoading: contextIsLoading,
    session,
    user,
    error,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};
