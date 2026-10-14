'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

/**
 * PLAT-02: names the signed-in account on this tab's error reports by its id
 * only, the same id the API's reports carry, and forgets it on the way out.
 * A no-op without a DSN.
 */
export function ObservabilityUser() {
	const { user } = useSupabaseAuth()
	const id = user?.id ?? null

	useEffect(() => {
		Sentry.setUser(id ? { id } : null)
		return () => Sentry.setUser(null)
	}, [id])

	return null
}
