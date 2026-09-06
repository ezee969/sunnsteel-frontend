import { useQuery } from '@tanstack/react-query'

import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

import {
	bootstrapWorkoutAnalytics,
	workoutAnalyticsService,
} from '../services/workoutAnalyticsService'

export function useWorkoutAnalytics() {
	const { session, isLoading } = useSupabaseAuth()
	const query = useQuery({
		queryKey: ['workout', 'analytics', session?.user.id],
		queryFn: bootstrapWorkoutAnalytics,
		enabled: !isLoading && !!session,
		refetchInterval: query =>
			query.state.data?.state === 'BUILDING' ? 2000 : false,
	})
	const retry = async () => {
		if (query.data?.state === 'FAILED' && query.data.requestedTimeZone) {
			await workoutAnalyticsService.register({
				timeZone: query.data.requestedTimeZone,
				onlyIfUnset: true,
			})
		}
		return query.refetch()
	}
	return { ...query, retry }
}
