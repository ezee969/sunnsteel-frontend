'use client'

import { ReactNode, useEffect } from 'react'

import { SHOULD_LOG_PERFORMANCE } from '@/lib/config/env'
import { logger } from '@/lib/utils/logger'
import { performanceMonitor } from '@/lib/utils/performance-monitor'
import { assertClientEnv } from '@/schema/env.client'

// import { Provider } from 'react-redux';
// import { store } from '@/lib/redux/store';
import { QueryProvider } from './query-provider'
import { SupabaseAuthProvider } from './supabase-auth-provider'
import { AppToastProvider } from './toast-provider'

export function AppProvider({ children }: { children: ReactNode }) {
	// Run client-env validation once after mount (avoids SSR mismatch risk)
	useEffect(() => {
		try {
			assertClientEnv()
		} catch (e) {
			// Non-fatal; logged in assertClientEnv
			logger.warn('[env] validation threw', e)
		}
	}, [])

	// Record hydration timing (opt-in via environment or development mode)
	useEffect(() => {
		const shouldLog = SHOULD_LOG_PERFORMANCE

		if (shouldLog) {
			performanceMonitor.recordMetric(
				'App Hydration Complete',
				performance.now(),
				'component',
			)
		}
	}, [])

	return (
		// <Provider store={store}>
		// {/* </Provider> */}
		<QueryProvider>
			<SupabaseAuthProvider>
				<AppToastProvider>{children}</AppToastProvider>
			</SupabaseAuthProvider>
		</QueryProvider>
	)
}
