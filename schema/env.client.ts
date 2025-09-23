// Runtime validation for public environment variables.
// Executed client-side once (import in AppProvider) to surface misconfiguration early.

import { z } from 'zod'

const EnvSchema = z.object({
	NEXT_PUBLIC_API_URL: z.string().url().optional(),
	NEXT_PUBLIC_FRONTEND_URL: z.string().url().optional(),
	NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
	NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10),
	NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().min(10).optional(),
})

export type ClientEnv = z.infer<typeof EnvSchema>

let cached: ClientEnv | null = null

export function getClientEnv(): ClientEnv {
	if (cached) return cached
	const parsed = EnvSchema.safeParse(process.env)
	if (!parsed.success) {
		console.warn('[env] Client env validation failed', parsed.error.flatten())
		cached = {} as ClientEnv
		return cached
	}
	cached = parsed.data
	return cached
}

export function assertClientEnv(): void {
	const env = getClientEnv()
	// Soft warnings for optional but recommended vars
	if (!env.NEXT_PUBLIC_API_URL) {
		console.info('[env] NEXT_PUBLIC_API_URL not set - using default http://localhost:4000/api')
	}
}
