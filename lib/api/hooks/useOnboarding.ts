import type {
	MeasurableGoalInput,
	UpdateOnboardingRequest,
	UserProfile,
} from '@sunsteel/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { userService } from '@/lib/api/services/userService'

import {
	GOAL_SUGGESTIONS_PREFIX,
	measurableGoalsKey,
} from './useMeasurableGoals'

/** ONBOARD-01: progress through onboarding; the answer replaces the profile. */
export function useUpdateOnboarding() {
	const queryClient = useQueryClient()
	return useMutation<UserProfile, Error, UpdateOnboardingRequest>({
		mutationFn: userService.updateOnboarding,
		onSuccess: profile => queryClient.setQueryData(['user'], profile),
	})
}

/**
 * ONBOARD-01: add one goal to the stored list, read fresh first so a goal
 * saved elsewhere is kept -- the same write ACH-06's Add goal makes.
 */
export function useAddMeasurableGoal() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (goal: MeasurableGoalInput) => {
			const goals = await queryClient.fetchQuery({
				queryKey: measurableGoalsKey,
				queryFn: userService.getMeasurableGoals,
				staleTime: 0,
			})
			return userService.replaceMeasurableGoals({
				goals: [
					...goals.map(stored => ({
						id: stored.id,
						type: stored.type,
						targetValue: stored.targetValue,
						direction: stored.direction,
						...(stored.exercise ? { exerciseId: stored.exercise.id } : {}),
					})),
					goal,
				],
			})
		},
		onSuccess: goals => {
			queryClient.setQueryData(measurableGoalsKey, goals)
			void queryClient.invalidateQueries({
				queryKey: ['workout', 'progress', 'goals'],
			})
			void queryClient.invalidateQueries({ queryKey: GOAL_SUGGESTIONS_PREFIX })
		},
	})
}
