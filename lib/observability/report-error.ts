import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

/**
 * PLAT-02: an error boundary reports what it caught, unless it is the API
 * refusing (a 4xx), which is the product working and already said to the
 * member. A no-op without a DSN.
 */
export function shouldReport(error: unknown): boolean {
	const status = (error as { status?: unknown } | null)?.status
	return !(typeof status === 'number' && status >= 400 && status < 500)
}

export function reportBoundaryError(error: unknown): void {
	if (shouldReport(error)) Sentry.captureException(error)
}

/** Reports an error boundary's error once per error it receives. */
export function useReportBoundaryError(error: unknown): void {
	useEffect(() => {
		reportBoundaryError(error)
	}, [error])
}
