import type {
	UserProfile,
	WeekStartsOn,
	WorkoutAnalyticsStatus,
} from '@sunsteel/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { userService } from '@/lib/api/services/userService'
import { workoutAnalyticsService } from '@/lib/api/services/workoutAnalyticsService'

/**
 * PREF-04: the weekday the account's weeks start on. The server sums every
 * weekly number in it, so the Progress reads are refreshed with the profile.
 */
export function useUpdateWeekStart() {
	const queryClient = useQueryClient()
	return useMutation<UserProfile, Error, WeekStartsOn>({
		mutationFn: weekStartsOn => userService.updateWeekStart({ weekStartsOn }),
		onSuccess: profile => {
			queryClient.setQueryData(['user'], profile)
			void queryClient.invalidateQueries({ queryKey: ['workout', 'progress'] })
		},
	})
}

/**
 * PREF-04: change the account's time zone. The server starts a new analytics
 * generation in it, so everything read from the analytics is refreshed and
 * the status polls until the new one is ready (`useWorkoutAnalytics`).
 */
export function useChangeTimeZone() {
	const queryClient = useQueryClient()
	return useMutation<WorkoutAnalyticsStatus, Error, string>({
		mutationFn: timeZone => workoutAnalyticsService.register({ timeZone }),
		onSuccess: () => {
			for (const key of [
				['workout'],
				['user'],
				['achievements'],
				['activity'],
			] as const) {
				void queryClient.invalidateQueries({ queryKey: key })
			}
		},
	})
}
