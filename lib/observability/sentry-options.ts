import type { BrowserOptions } from '@sentry/nextjs'

import { redactBreadcrumb, redactEvent } from './redact'

/**
 * PLAT-02: the browser's Sentry options. **Without a DSN nothing is
 * initialised**, so a build without `NEXT_PUBLIC_SENTRY_DSN` runs exactly as
 * before.
 */

export type ObservabilityEnv = {
	dsn?: string
	environment?: string
	tracesSampleRate?: string
	apiUrl?: string
	nodeEnv?: string
}

const DEFAULT_API_URL = 'http://localhost:4000/api'
const DEVELOPMENT_TRACE_RATE = 1
const PRODUCTION_TRACE_RATE = 0.2

/**
 * The realtime stream is one request held open for minutes (MSG-06); a span
 * for it would stay open as long and describe nothing.
 */
const UNTRACED_PATHS = ['/realtime/stream']

export function traceSampleRate(env: ObservabilityEnv): number {
	const fallback =
		env.nodeEnv === 'production'
			? PRODUCTION_TRACE_RATE
			: DEVELOPMENT_TRACE_RATE
	const raw = env.tracesSampleRate
	if (raw === undefined || raw.trim() === '') return fallback
	const rate = Number(raw)
	return Number.isFinite(rate) && rate >= 0 && rate <= 1 ? rate : fallback
}

/**
 * Trace headers go to our own API and nowhere else: Supabase and any other
 * origin would refuse them (CORS) and have no use for them.
 */
export function apiOrigin(apiUrl: string | undefined): string | null {
	try {
		return new URL(apiUrl || DEFAULT_API_URL).origin
	} catch {
		return null
	}
}

export function shouldTraceRequest(url: string): boolean {
	const path = url.split(/[?#]/)[0]
	return !UNTRACED_PATHS.some(untraced => path.endsWith(untraced))
}

export function browserSentryOptions(
	env: ObservabilityEnv,
): BrowserOptions | null {
	const dsn = env.dsn?.trim()
	if (!dsn) return null
	const origin = apiOrigin(env.apiUrl)

	return {
		dsn,
		environment: env.environment || env.nodeEnv || 'development',
		sendDefaultPii: false,
		tracesSampleRate: traceSampleRate(env),
		tracePropagationTargets: origin ? [origin] : [],
		beforeSend: event => redactEvent(event),
		beforeSendTransaction: event => redactEvent(event),
		beforeBreadcrumb: breadcrumb => redactBreadcrumb(breadcrumb),
	}
}
