import type {
	CustomExerciseInput,
	StarredExercisesResponse,
	UpdateCustomExerciseRequest,
} from '@sunsteel/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'

import { useToast } from '@/components/ui/toast'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { usePerformanceQuery } from '@/hooks/use-performance-query'
import type { Exercise } from '@/lib/api/types/exercise.type'
import { describeCustomExerciseError } from '@/lib/utils/custom-exercises'
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
	const errorText = useApiErrorMessage()
	const queryClient = useQueryClient()
	const { push } = useToast()
	const t = useTranslations('core.exercisesHook')
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
				title: t('starNotSavedTitle'),
				description: errorText(error) || t('tryAgainMoment'),
			})
		},
		onSuccess: data => {
			queryClient.setQueryData(starredExercisesKey, data)
		},
	})
}

/**
 * EXER-06: a custom exercise write refreshes the catalog, and the routines,
 * which name their exercises and would otherwise show a stale name.
 */
type CustomExerciseFailureKey =
	| 'exerciseNotCreatedTitle'
	| 'exerciseNotSavedTitle'
	| 'exerciseNotChangedTitle'
	| 'exerciseNotDeletedTitle'

function useCustomExerciseWrite<TVariables, TResult>(
	mutationFn: (variables: TVariables) => Promise<TResult>,
	failureTitleKey: CustomExerciseFailureKey,
) {
	const queryClient = useQueryClient()
	const { push } = useToast()
	const t = useTranslations('core.exercisesHook')
	const tRefusal = useTranslations('routines.customExercise')
	return useMutation<TResult, Error, TVariables>({
		mutationFn,
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['exercises'] }),
				queryClient.invalidateQueries({ queryKey: ['routines'] }),
			])
		},
		onError: error => {
			push({
				title: t(failureTitleKey),
				description: describeCustomExerciseError(error.message, tRefusal),
			})
		},
	})
}

export const useCreateCustomExercise = () =>
	useCustomExerciseWrite<CustomExerciseInput, Exercise>(
		exercisesService.createCustom,
		'exerciseNotCreatedTitle',
	)

export const useUpdateCustomExercise = () =>
	useCustomExerciseWrite<
		{ id: string; patch: UpdateCustomExerciseRequest },
		Exercise
	>(
		({ id, patch }) => exercisesService.updateCustom(id, patch),
		'exerciseNotSavedTitle',
	)

export const useArchiveCustomExercise = () =>
	useCustomExerciseWrite<{ id: string; archived: boolean }, Exercise>(
		({ id, archived }) => exercisesService.setCustomArchived(id, archived),
		'exerciseNotChangedTitle',
	)

/**
 * Deleting leaves the refresh running in the background: the page that showed
 * the exercise navigates away first, since awaiting the refetch would unmount
 * it (and its navigation) the moment the exercise disappears.
 */
export const useDeleteCustomExercise = () => {
	const queryClient = useQueryClient()
	const { push } = useToast()
	const t = useTranslations('core.exercisesHook')
	const tRefusal = useTranslations('routines.customExercise')
	return useMutation<void, Error, string>({
		mutationFn: exercisesService.deleteCustom,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ['exercises'] })
		},
		onError: error => {
			push({
				title: t('exerciseNotDeletedTitle'),
				description: describeCustomExerciseError(error.message, tRefusal),
			})
		},
	})
}
