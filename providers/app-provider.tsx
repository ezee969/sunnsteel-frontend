'use client';

import { ReactNode } from 'react';
// import { Provider } from 'react-redux';
// import { store } from '@/lib/redux/store';
import { QueryProvider } from './query-provider';
import { SupabaseAuthProvider } from './supabase-auth-provider';
import { AppToastProvider } from './toast-provider';
import { useEffect } from 'react';
import { assertClientEnv } from '@/schema/env.client';
import { performanceMonitor } from '@/lib/utils/performance-monitor';

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

  // Record hydration timing (opt-in via environment or development mode)
  useEffect(() => {
    const shouldLog = process.env.NODE_ENV === 'development' || 
                     process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_LOGS === 'true';
    
    if (shouldLog) {
      performanceMonitor.recordMetric('App Hydration Complete', performance.now(), 'component');
    }
  }, []);

  return (
    // <Provider store={store}>
    // {/* </Provider> */}
    <QueryProvider>
      <SupabaseAuthProvider>
        <AppToastProvider>
          {children}
        </AppToastProvider>
      </SupabaseAuthProvider>
    </QueryProvider>
  );
}
