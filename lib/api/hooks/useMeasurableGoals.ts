import type {
	MeasurableGoal,
	ReplaceMeasurableGoalsRequest,
} from '@sunsteel/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { userService } from '@/lib/api/services/userService'

export const measurableGoalsKey = ['user', 'measurable-goals'] as const
export const GOAL_SUGGESTIONS_PREFIX = [
	'workout',
	'progress',
	'goal-suggestions',
] as const

export const useMeasurableGoals = () =>
	useQuery<MeasurableGoal[], Error>({
		queryKey: measurableGoalsKey,
		queryFn: userService.getMeasurableGoals,
	})

export const useReplaceMeasurableGoals = () => {
	const queryClient = useQueryClient()

	return useMutation<MeasurableGoal[], Error, ReplaceMeasurableGoalsRequest>({
		mutationFn: userService.replaceMeasurableGoals,
		onSuccess: goals => {
			queryClient.setQueryData(measurableGoalsKey, goals)
			void queryClient.invalidateQueries({
				queryKey: ['workout', 'progress', 'goals'],
			})
			// ACH-06: a goal of a suggested type takes that suggestion's place.
			void queryClient.invalidateQueries({
				queryKey: GOAL_SUGGESTIONS_PREFIX,
			})
		},
	})
}
