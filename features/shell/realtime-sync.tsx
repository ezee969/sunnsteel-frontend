'use client'

import { useRealtimeStream } from '@/lib/api/hooks/useRealtimeStream'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

/**
 * MSG-06: keeps this tab's realtime stream open for the signed-in member, so
 * the bell updates when something happens instead of on its next poll.
 */
export function RealtimeSync() {
	const { session } = useSupabaseAuth()
	useRealtimeStream(session?.user.id ?? null)
	return null
}
