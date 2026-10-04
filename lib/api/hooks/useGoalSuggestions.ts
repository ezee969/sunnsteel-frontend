import type {
	GoalSuggestion,
	GoalSuggestionsResponse,
	MeasurableGoal,
} from '@sunsteel/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { userService } from '@/lib/api/services/userService'
import { workoutService } from '@/lib/api/services/workoutService'
import { acceptSuggestionRequest } from '@/lib/utils/goal-suggestions'
import { useSupabaseAuth as useAuth } from '@/providers/supabase-auth-provider'

import {
	GOAL_SUGGESTIONS_PREFIX,
	measurableGoalsKey,
} from './useMeasurableGoals'
import { useWorkoutAnalytics } from './useWorkoutAnalytics'

export const goalSuggestionsKey = (timeZone: string) =>
	[...GOAL_SUGGESTIONS_PREFIX, timeZone] as const

/**
 * ACH-06: the server's suggestions, read once the analytics projection is
 * ready in the account's zone, like the goals they would join.
 */
export const useGoalSuggestions = ({ enabled = true } = {}) => {
	const { session, isLoading } = useAuth()
	const analytics = useWorkoutAnalytics()
	const timeZone =
		analytics.data?.state === 'READY' ? analytics.data.timeZone : null
	return useQuery<GoalSuggestionsResponse>({
		queryKey: goalSuggestionsKey(timeZone ?? ''),
		queryFn: () => workoutService.getGoalSuggestions(timeZone!),
		enabled: enabled && !isLoading && !!session && !!timeZone,
	})
}

function invalidateGoals(queryClient: ReturnType<typeof useQueryClient>) {
	void queryClient.invalidateQueries({
		queryKey: ['workout', 'progress', 'goals'],
	})
	void queryClient.invalidateQueries({ queryKey: GOAL_SUGGESTIONS_PREFIX })
}

/**
 * Adding a suggestion is the ordinary goals write with one more goal: the
 * stored list is read fresh first, so a goal saved on another device is kept
 * rather than written over.
 */
export const useAcceptGoalSuggestion = () => {
	const queryClient = useQueryClient()
	return useMutation<MeasurableGoal[], Error, GoalSuggestion>({
		mutationFn: async suggestion => {
			const goals = await queryClient.fetchQuery({
				queryKey: measurableGoalsKey,
				queryFn: userService.getMeasurableGoals,
				staleTime: 0,
			})
			return userService.replaceMeasurableGoals(
				acceptSuggestionRequest(goals, suggestion),
			)
		},
		onSuccess: goals => {
			queryClient.setQueryData(measurableGoalsKey, goals)
			invalidateGoals(queryClient)
		},
	})
}

type SuggestionsSnapshot = Array<
	[readonly unknown[], GoalSuggestionsResponse | undefined]
>

/**
 * "Not now" leaves the list at once and is stored on the account; a failure
 * puts it back.
 */
export const useDismissGoalSuggestion = () => {
	const queryClient = useQueryClient()
	return useMutation<
		unknown,
		Error,
		GoalSuggestion,
		{ previous: SuggestionsSnapshot }
	>({
		mutationFn: suggestion =>
			workoutService.dismissGoalSuggestion({
				key: suggestion.key,
				targetValue: suggestion.targetValue,
			}),
		onMutate: async suggestion => {
			await queryClient.cancelQueries({ queryKey: GOAL_SUGGESTIONS_PREFIX })
			const previous = queryClient.getQueriesData<GoalSuggestionsResponse>({
				queryKey: GOAL_SUGGESTIONS_PREFIX,
			})
			queryClient.setQueriesData<GoalSuggestionsResponse>(
				{ queryKey: GOAL_SUGGESTIONS_PREFIX },
				data =>
					data && {
						...data,
						suggestions: data.suggestions.filter(
							item => item.key !== suggestion.key,
						),
					},
			)
			return { previous }
		},
		onError: (_error, _suggestion, context) => {
			for (const [key, data] of context?.previous ?? []) {
				queryClient.setQueryData(key, data)
			}
		},
		onSettled: () => {
			void queryClient.invalidateQueries({ queryKey: GOAL_SUGGESTIONS_PREFIX })
		},
	})
}
