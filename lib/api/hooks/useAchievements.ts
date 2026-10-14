import { useQuery } from '@tanstack/react-query'

import { achievementService } from '@/lib/api/services/achievementService'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

export const achievementQueryKey = ['achievements'] as const

/**
 * `enabled` lets a surface that needs the ledger only on demand -- the message
 * composer, MSG-12/MSG-13 -- leave it alone: the read takes the account lock
 * and reconciles awards, so it must not run on every conversation opened.
 */
export function useAchievements({
	enabled = true,
}: { enabled?: boolean } = {}) {
	const { session, isLoading } = useSupabaseAuth()
	return useQuery({
		queryKey: achievementQueryKey,
		queryFn: achievementService.list,
		enabled: enabled && !isLoading && Boolean(session),
		// A completed session can unlock milestones while this route is unmounted.
		staleTime: 0,
	})
}
