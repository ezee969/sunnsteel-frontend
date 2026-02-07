'use client'

import React from 'react'
import ParchmentOverlay from '@/components/backgrounds/ParchmentOverlay'
import { useTheme } from 'next-themes'

export function BackgroundOverlay() {
	const { resolvedTheme } = useTheme()
	// Prevent hydration mismatch by deferring theme-based differences until mounted
	const [mounted, setMounted] = React.useState(false)
	React.useEffect(() => setMounted(true), [])
	const isDark = mounted ? resolvedTheme === 'dark' : false
	return (
		<div className="absolute inset-0 z-0 overflow-hidden">
			{/* Subtle parchment texture and gold vignette */}
			<ParchmentOverlay opacity={isDark ? 0.12 : 0.08} />
			<ParchmentOverlay opacity={isDark ? 0.12 : 0.08} />
		</div>
	)
}
