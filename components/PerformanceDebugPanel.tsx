'use client'

import { useEffect, useState } from 'react'

import { useQueryPerformance } from '@/hooks/use-performance-query'
import { SHOULD_SHOW_PERFORMANCE_PANEL } from '@/lib/config/env'

/**
 * Development-only performance debugging panel
 * Shows performance metrics when enabled via environment variables
 */
export function PerformanceDebugPanel() {
	const [isVisible, setIsVisible] = useState(false)
	const [metrics, setMetrics] = useState<string>('')
	const { getMetrics, generateReport, getAverageFirstFetch } =
		useQueryPerformance()

	const shouldShow = SHOULD_SHOW_PERFORMANCE_PANEL

	useEffect(() => {
		if (shouldShow && isVisible) {
			const interval = setInterval(() => {
				const report = generateReport()
				setMetrics(report)
			}, 2000)

			return () => clearInterval(interval)
		}
	}, [shouldShow, isVisible, generateReport])

	if (!shouldShow) return null

	return (
		// TD-31: dev-only, but on the system's tokens rather than a raw blue
		// button over a black terminal. A `panel` (§11.5) in Space Mono, square
		// to 2px, separated by its rule rather than a shadow (§8). Capped to the
		// viewport, so at 320 it no longer runs off the left edge.
		<div className="fixed bottom-4 right-4 z-50">
			<button
				type="button"
				onClick={() => setIsVisible(!isVisible)}
				className="type-data rounded-sm border border-rule bg-surface px-3 py-2 text-foreground transition-colors duration-[var(--motion-fast)] ease-standard hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
			>
				{isVisible ? 'Hide' : 'Show'} Perf ({getMetrics().length})
			</button>

			{isVisible && (
				<div className="type-data mt-2 max-h-96 max-w-[calc(100vw-2rem)] overflow-auto rounded-sm border border-rule bg-surface p-4 text-foreground sm:max-w-md">
					<div className="mb-2 border-b border-rule-faint pb-2">
						<div className="type-label text-ink-3">📊 Performance Metrics</div>
						<div>Avg First Fetch: {getAverageFirstFetch().toFixed(2)}ms</div>
						<div>Total Metrics: {getMetrics().length}</div>
					</div>
					<pre className="type-data whitespace-pre-wrap text-ink-2">
						{metrics || 'No metrics yet...'}
					</pre>
				</div>
			)}
		</div>
	)
}
