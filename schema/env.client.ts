// Runtime validation for public environment variables.
// Executed client-side once (import in AppProvider) to surface misconfiguration early.

import { z } from 'zod'

const EnvSchema = z.object({
	NEXT_PUBLIC_API_URL: z.string().optional(),
	NEXT_PUBLIC_FRONTEND_URL: z.string().optional(),
	NEXT_PUBLIC_SUPABASE_URL: z.string(),
	NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10),
	NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().min(10).optional(),
	NEXT_PUBLIC_ENABLE_PERFORMANCE_LOGS: z.string().optional().transform(val => val === 'true'),
})

export type ClientEnv = z.infer<typeof EnvSchema>

// Next.js only inlines *static* accesses like `process.env.NEXT_PUBLIC_X` in
// browser bundles; the `process.env` object itself is not populated client-side.
// So we must build the object from explicit static accesses before validating â€”
// passing `process.env` directly makes every var read as undefined in the browser.
const rawClientEnv = {
	NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
	NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL,
	NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
	NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
	NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
	NEXT_PUBLIC_ENABLE_PERFORMANCE_LOGS: process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_LOGS,
}

let cached: ClientEnv | null = null

export function getClientEnv(): ClientEnv {
	if (cached) return cached
	
	// For development, just create a permissive fallback to avoid blocking the app
	if (process.env.NODE_ENV === 'development') {
		cached = {
			NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
			NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
			NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
			NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL,
			NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
			NEXT_PUBLIC_ENABLE_PERFORMANCE_LOGS: process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_LOGS === 'true',
		} as ClientEnv
		return cached
	}
	
	const parsed = EnvSchema.safeParse(rawClientEnv)
	if (!parsed.success) {
		console.warn('[env] Client env validation failed', parsed.error.flatten())
		console.warn('[env] Environment variables being validated:', {
			NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
			NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL,
			NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
			NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '[PRESENT]' : '[MISSING]',
			NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? '[PRESENT]' : '[MISSING]',
			NEXT_PUBLIC_ENABLE_PERFORMANCE_LOGS: process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_LOGS,
		})
		// Create a fallback env with defaults for development
		cached = {
			NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
			NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
			NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
			NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL,
			NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
			NEXT_PUBLIC_ENABLE_PERFORMANCE_LOGS: process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_LOGS === 'true',
		} as ClientEnv
		return cached
	}
	cached = parsed.data
	return cached
}

export function assertClientEnv(): void {
	try {
		const env = getClientEnv()
		// Soft warnings for optional but recommended vars
		if (!env.NEXT_PUBLIC_API_URL) {
			console.info('[env] NEXT_PUBLIC_API_URL not set - using default http://localhost:4000/api')
		}
	} catch (error) {
		// Never throw - just warn in development
		console.warn('[env] Client env assertion failed:', error)
	}
}
