'use client';

import { createContext, useContext, ReactNode, useEffect, useState, useRef } from 'react';
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
  // Track whether the INITIAL_SESSION event has been handled
  const initialSessionHandled = useRef(false);

  useEffect(() => {
    // Rely solely on onAuthStateChange to avoid race conditions.
    // onAuthStateChange fires INITIAL_SESSION synchronously with the stored session,
    // so there is no need for a separate getInitialSession call.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      console.log('Session details:', {
        hasSession: !!session,
        accessToken: session?.access_token ? 'present' : 'missing',
        userId: session?.user?.id,
      });

      // Ignore TOKEN_REFRESHED events to prevent infinite loops
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed, skipping verification to prevent loop');
        setSession(session);
        return;
      }

      setSession(session);
      setError(null);

      if (session) {
        try {
          const userProfile = await supabaseAuthService.verifyToken(
            session.access_token
          );
          setUser(userProfile.user);
          // Mark client-side session for middleware detection
          try {
            if (typeof document !== 'undefined') {
              document.cookie = [
                'has_session=1',
                'Path=/',
                'Max-Age=604800',
                'SameSite=Lax',
              ].join('; ');
            }
          } catch {}

          queryClient.invalidateQueries({ queryKey: ['user'] });
        } catch (err) {
          console.error('Failed to verify token with backend:', err);
          setError(err as Error);
          setUser(null);
          try {
            if (typeof document !== 'undefined') {
              document.cookie = 'has_session=; Max-Age=0; path=/';
            }
          } catch {}
        }
      } else {
        setUser(null);
        queryClient.clear();
        try {
          if (typeof document !== 'undefined') {
            document.cookie = 'has_session=; Max-Age=0; path=/';
          }
        } catch {}
      }

      // Mark loading as done after the first INITIAL_SESSION event is processed
      if (!initialSessionHandled.current) {
        initialSessionHandled.current = true;
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Skip loading on auth pages to avoid redirect loops
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/auth/callback';
  const contextIsLoading = isAuthPage ? false : isLoading;

  const value = {
    // isAuthenticated requires both a Supabase session AND a verified backend user profile
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
