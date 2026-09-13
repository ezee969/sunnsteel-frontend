'use client'

import { MotionConfig } from 'framer-motion'
import { ReactNode, useEffect } from 'react'

import { useMotionPreference } from '@/hooks/use-motion-preference'
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
	const { preference } = useMotionPreference()

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
		// Motion spec §3 / a11y review 5: framer-motion writes transforms
		// inline, beyond the reach of the reduced-motion CSS block. "user" drops
		// transform and layout animation under the OS setting and keeps opacity;
		// the A11Y-01 device preference forces the same with "always".
		<MotionConfig reducedMotion={preference === 'reduce' ? 'always' : 'user'}>
			<QueryProvider>
				<SupabaseAuthProvider>
					<AppToastProvider>{children}</AppToastProvider>
				</SupabaseAuthProvider>
			</QueryProvider>
		</MotionConfig>
	)
}
