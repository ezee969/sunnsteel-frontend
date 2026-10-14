import * as Sentry from '@sentry/nextjs'

import {
	browserSentryOptions,
	shouldTraceRequest,
} from '@/lib/observability/sentry-options'

// PLAT-02: error reports and traces from the browser. Next runs this before
// the app hydrates. Without NEXT_PUBLIC_SENTRY_DSN nothing is initialised.
const options = browserSentryOptions({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
	environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
	tracesSampleRate: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
	apiUrl: process.env.NEXT_PUBLIC_API_URL,
	nodeEnv: process.env.NODE_ENV,
})

if (options) {
	Sentry.init({
		...options,
		integrations: [
			Sentry.browserTracingIntegration({
				shouldCreateSpanForRequest: shouldTraceRequest,
			}),
			// Console lines can repeat anything the app logged.
			Sentry.breadcrumbsIntegration({ console: false }),
		],
	})
}

export const onRouterTransitionStart = options
	? Sentry.captureRouterTransitionStart
	: undefined
