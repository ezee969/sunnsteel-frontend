import { useQuery } from '@tanstack/react-query'

import { achievementService } from '@/lib/api/services/achievementService'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

export const achievementQueryKey = ['achievements'] as const

export function useAchievements() {
	const { session, isLoading } = useSupabaseAuth()
	return useQuery({
		queryKey: achievementQueryKey,
		queryFn: achievementService.list,
		enabled: !isLoading && Boolean(session),
		// A completed session can unlock milestones while this route is unmounted.
		staleTime: 0,
	})
}
