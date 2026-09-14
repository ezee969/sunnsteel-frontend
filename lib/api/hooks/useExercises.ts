import type { StarredExercisesResponse } from '@sunsteel/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useToast } from '@/components/ui/toast'
import { usePerformanceQuery } from '@/hooks/use-performance-query'
import { applyStarChange } from '@/lib/utils/exercise-picker'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

import { exercisesService } from '../services/exercisesService'

export const useExercises = () => {
	return usePerformanceQuery(
		{
			queryKey: ['exercises'],
			queryFn: exercisesService.getAll,
			staleTime: 1000 * 60 * 30, // 30 minutes - exercises rarely change
			gcTime: 1000 * 60 * 60, // 1 hour
		},
		'Exercises Load',
	)
}

export const starredExercisesKey = ['exercises', 'starred'] as const

/** EXER-07: private stars that order pickers and filter the catalog. */
export const useStarredExercises = () => {
	const { session, isLoading } = useSupabaseAuth()
	return useQuery<StarredExercisesResponse>({
		queryKey: starredExercisesKey,
		queryFn: exercisesService.getStarred,
		enabled: !isLoading && !!session,
	})
}

/**
 * Stars or unstars optimistically; the server's list replaces the cache, and
 * a failure restores the previous list and says so.
 */
export const useToggleExerciseStar = () => {
	const queryClient = useQueryClient()
	const { push } = useToast()
	return useMutation<
		StarredExercisesResponse,
		Error,
		{ exerciseId: string; starred: boolean },
		{ previous?: StarredExercisesResponse }
	>({
		mutationFn: ({ exerciseId, starred }) =>
			starred
				? exercisesService.star(exerciseId)
				: exercisesService.unstar(exerciseId),
		onMutate: async ({ exerciseId, starred }) => {
			await queryClient.cancelQueries({ queryKey: starredExercisesKey })
			const previous =
				queryClient.getQueryData<StarredExercisesResponse>(starredExercisesKey)
			queryClient.setQueryData(
				starredExercisesKey,
				applyStarChange(
					previous,
					exerciseId,
					starred,
					new Date().toISOString(),
				),
			)
			return { previous }
		},
		onError: (error, _variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(starredExercisesKey, context.previous)
			} else {
				void queryClient.invalidateQueries({ queryKey: starredExercisesKey })
			}
			push({
				title: 'Star not saved',
				description: error.message || 'Try again in a moment.',
			})
		},
		onSuccess: data => {
			queryClient.setQueryData(starredExercisesKey, data)
		},
	})
}
