'use client';

import { createContext, useContext, ReactNode, useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabaseAuthService } from '@/lib/api/services/supabaseAuthService';
import { supabase } from '@/lib/supabase/client';
import { usePathname } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';
import type { AuthResponse } from '@/lib/api/services/supabaseAuthService';

interface SupabaseAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: Session | null;
  user: AuthResponse['user'] | null;
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
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
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
      logger.debug('[auth] state change', event, {
        hasSession: !!session,
        userId: session?.user?.id,
      });

      // Ignore TOKEN_REFRESHED events to prevent infinite loops
      if (event === 'TOKEN_REFRESHED') {
        logger.debug('[auth] token refreshed');
        setSession(session);
        return;
      }

      // Drop the routing marker BEFORE publishing a null session.
      //
      // The protected layout redirects to /login the instant it observes
      // `session === null`. If `ss_session` is still set at that moment,
      // middleware bounces the redirect straight back to /dashboard, the layout
      // renders its empty shell, and the app parks there — a black screen.
      //
      // Clearing it after `setSession(null)` is NOT enough: on the initial load
      // `isLoading` happens to gate the layout's redirect effect, but on logout
      // loading is already resolved, so nothing holds the redirect back. Doing
      // it here makes the invariant hold on every path. See TD-21.
      if (!session) {
        await supabaseAuthService.clearSessionMarker();
      }

      setSession(session);
      setError(null);

      const resolveInitialLoad = () => {
        if (!initialSessionHandled.current) {
          initialSessionHandled.current = true;
          setIsLoading(false);
        }
      };

      if (session) {
        // Auth is resolved as soon as we know THERE IS a session — the backend
        // verification below is deliberately not a gate. Every protected
        // endpoint re-verifies the token and get-or-creates the user through
        // SupabaseJwtGuard (backend `supabase-jwt.strategy.ts`), so `/verify`
        // duplicates that work rather than being a prerequisite for it.
        // Resolving here lets data queries run against `session` in parallel
        // with the verification instead of behind it. See TD-18.
        resolveInitialLoad();

        try {
          const userProfile = await supabaseAuthService.verifyToken(
            session.access_token
          );
          setUser(userProfile.user);
          queryClient.invalidateQueries({ queryKey: ['user'] });
        } catch (err) {
          logger.error('[auth] backend verification failed', err);
          setUser(null);
          // Order matters: drop the routing marker BEFORE publishing the error,
          // because the error is what makes the protected layout bounce to
          // /login. With a stale `ss_session` still set, the middleware would
          // bounce us straight back — see the `else` branch below.
          await supabaseAuthService.clearSessionMarker();
          setError(err as Error);
        }
      } else {
        // The marker was already cleared above, before this null session was
        // published — that ordering is what keeps middleware from bouncing the
        // redirect back to /dashboard.
        setUser(null);
        queryClient.clear();
        resolveInitialLoad();
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
