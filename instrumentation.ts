import * as Sentry from '@sentry/nextjs'

import { redactBreadcrumb, redactEvent } from '@/lib/observability/redact'

/**
 * PLAT-02: errors from the little that runs on the server -- the middleware,
 * the root layout and the session route. Traces start in the browser and go
 * straight to the API, so none are recorded here, and no sample rate is set:
 * a server that decided "not sampled" would hand that decision to every page
 * it renders, and the browser would never trace. Without
 * NEXT_PUBLIC_SENTRY_DSN nothing is initialised.
 */
export function register() {
	const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()
	if (!dsn) return
	Sentry.init({
		dsn,
		environment:
			process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
			process.env.NODE_ENV ||
			'development',
		sendDefaultPii: false,
		beforeSend: event => redactEvent(event),
		beforeBreadcrumb: breadcrumb => redactBreadcrumb(breadcrumb),
	})
}

export const onRequestError = Sentry.captureRequestError
