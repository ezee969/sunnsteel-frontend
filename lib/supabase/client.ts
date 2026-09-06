import { createClient } from '@supabase/supabase-js'

import { PUBLIC_ENV } from '@/lib/config/env'

const supabaseUrl = PUBLIC_ENV.SUPABASE_URL
const supabaseAnonKey = PUBLIC_ENV.SUPABASE_ANON_KEY

// During build time, environment variables might not be available
// Create a dummy client to prevent build errors, but throw at runtime if needed
if (!supabaseUrl || !supabaseAnonKey) {
	if (typeof window !== 'undefined') {
		// Only throw error on client-side (runtime)
		throw new Error('Missing Supabase environment variables')
	}

	// During build time (server-side), create dummy client to prevent build errors
	console.warn(
		'[supabase] environment variables not found during build - using dummy client',
	)
}

export const supabase = createClient(
	supabaseUrl || 'https://dummy.supabase.co',
	supabaseAnonKey || 'dummy-key',
	{
		auth: {
			autoRefreshToken: true,
			persistSession: true,
			detectSessionInUrl: true,
		},
	},
)
