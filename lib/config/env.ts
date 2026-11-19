const asBoolean = (value: string | undefined): boolean => value === 'true'

export const APP_ENV = process.env.NODE_ENV ?? 'development'
export const IS_DEVELOPMENT = APP_ENV === 'development'

export const PUBLIC_ENV = {
	API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
	FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
	SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || '',
	SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
	SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
	SHOW_PERFORMANCE_PANEL: asBoolean(
		process.env.NEXT_PUBLIC_SHOW_PERFORMANCE_PANEL,
	),
	ENABLE_PERFORMANCE_LOGS: asBoolean(
		process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_LOGS,
	),
	ENABLE_DEBUG_LOGS: asBoolean(process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS),
} as const

/**
 * The app's public address: what links in emails, OAuth callbacks and the
 * link-preview tags (`metadataBase`) are built on. `NEXT_PUBLIC_SITE_URL` is
 * the one Vercel sets; `FRONTEND_URL` alone fell back to localhost there, so
 * every shared link previewed `http://localhost:3000/og-image.jpg` -- an
 * image no app could fetch -- until 2026-11-19.
 */
export const PUBLIC_ORIGIN = PUBLIC_ENV.SITE_URL || PUBLIC_ENV.FRONTEND_URL

export const SHOULD_SHOW_PERFORMANCE_PANEL =
	IS_DEVELOPMENT && PUBLIC_ENV.SHOW_PERFORMANCE_PANEL
export const SHOULD_LOG_PERFORMANCE =
	IS_DEVELOPMENT || PUBLIC_ENV.ENABLE_PERFORMANCE_LOGS
export const SHOULD_LOG_DEBUG = IS_DEVELOPMENT || PUBLIC_ENV.ENABLE_DEBUG_LOGS
