'use client'

import { useEffect } from 'react'
import { SHOULD_ENABLE_ERUDA } from '@/lib/config/env'

/**
 * Eruda Mobile Developer Console
 * 
 * Provides a mobile-friendly developer console for debugging on iOS/Android.
 * Only loads in development mode or when NEXT_PUBLIC_ENABLE_ERUDA is set.
 * 
 * Usage:
 * - Tap the floating green icon to open the console
 * - Access Console, Elements, Network, Resources, and more
 * - Perfect for debugging on iPhone/iPad Chrome
 */
export function Eruda() {
	useEffect(() => {
		// Only load Eruda in development or when explicitly enabled
		const shouldLoadEruda = SHOULD_ENABLE_ERUDA

		if (!shouldLoadEruda) return

		// Dynamically import Eruda to avoid bundling in production
		import('eruda').then((eruda) => {
			eruda.default.init()
			console.log('📱 Eruda mobile console initialized')
		})
	}, [])

	return null
}
