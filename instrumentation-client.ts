import {
	configureSentry,
	routerTransitionStart,
} from '@/lib/observability/sentry-browser'
import { browserSentryOptions } from '@/lib/observability/sentry-options'

// PLAT-02: error reports and traces from the browser. Next runs this before
// the app hydrates. Without NEXT_PUBLIC_SENTRY_DSN nothing is initialised.
// SITE-01: the SDK itself loads on demand (sentry-browser.ts): at once on the
// app, only on an error or a move into the app on the public site.
const options = browserSentryOptions({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
	environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
	tracesSampleRate: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
	apiUrl: process.env.NEXT_PUBLIC_API_URL,
	nodeEnv: process.env.NODE_ENV,
})

if (options) {
	configureSentry({
		options,
		load: () => import('@sentry/nextjs'),
		target: window,
		pathname: () => window.location.pathname,
	})
}

export const onRouterTransitionStart = options
	? routerTransitionStart
	: undefined
