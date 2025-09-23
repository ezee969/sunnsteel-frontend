'use client';

import { ReactNode } from 'react';
// import { Provider } from 'react-redux';
// import { store } from '@/lib/redux/store';
import { QueryProvider } from './query-provider';
import { SupabaseAuthProvider } from './supabase-auth-provider';
import { useEffect } from 'react';
import { assertClientEnv } from '@/schema/env.client';

export function AppProvider({ children }: { children: ReactNode }) {
  // Run client-env validation once after mount (avoids SSR mismatch risk)
  useEffect(() => {
    try {
      assertClientEnv();
    } catch (e) {
      // Non-fatal; logged in assertClientEnv
      console.warn('[env] validation threw', e);
    }
  }, []);
  return (
    // <Provider store={store}>
    // {/* </Provider> */}
    <QueryProvider>
      <SupabaseAuthProvider>{children}</SupabaseAuthProvider>
    </QueryProvider>
  );
}
