import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usePerformanceQuery } from '@/hooks/use-performance-query'
import { logger } from '@/lib/utils/logger'
import { rtfApi } from '../etag-client'
import {
	routineQueryKeys,
	RoutineFilters,
	serializeRoutineFilters,
} from '../routines/routine-query'
import { routineService } from '../services/routineService'
import { CreateRoutineRequest, Routine } from '../types/routine.type'

const ROUTINES_QUERY_KEY = routineQueryKeys.all()

export const useRoutines = (filters?: RoutineFilters) => {
	const filterKey = serializeRoutineFilters(filters)

	return usePerformanceQuery<Routine[], Error>(
		{
			queryKey: routineQueryKeys.list(filters),
			queryFn: () => routineService.getUserRoutines(filters),
		},
		`Routines Load (${filterKey})`,
	)
}

type ToggleFavoriteContext = {
	previousList?: Routine[]
	previousItem?: Routine
}

export const useToggleRoutineFavorite = () => {
	const queryClient = useQueryClient()

	return useMutation<
		Routine,
		Error,
		{ id: string; isFavorite: boolean },
		ToggleFavoriteContext
	>({
		mutationFn: ({ id, isFavorite }) =>
			routineService.toggleFavorite(id, isFavorite),
		onMutate: async variables => {
			await queryClient.cancelQueries({ queryKey: ROUTINES_QUERY_KEY })

			const previousList =
				queryClient.getQueryData<Routine[]>(ROUTINES_QUERY_KEY)

			queryClient.setQueriesData<Routine[]>(
				{ queryKey: ROUTINES_QUERY_KEY },
				old =>
					(old ?? []).map(r =>
						r.id === variables.id
							? { ...r, isFavorite: variables.isFavorite }
							: r,
					),
			)

			const routineKey = routineQueryKeys.detail(variables.id)
			const previousItem = queryClient.getQueryData<Routine>(routineKey)
			if (previousItem) {
				queryClient.setQueryData<Routine>(routineKey, old =>
					old ? { ...old, isFavorite: variables.isFavorite } : old,
				)
			}

			return { previousList, previousItem }
		},
		onError: (_err, variables, context) => {
			if (context?.previousList) {
				queryClient.setQueryData<Routine[]>(
					ROUTINES_QUERY_KEY,
					context.previousList,
				)
			}
			if (context?.previousItem) {
				queryClient.setQueryData<Routine>(
					routineQueryKeys.detail(variables.id),
					context.previousItem,
				)
			}
		},
		onSettled: (_data, _error, variables) => {
			queryClient.invalidateQueries({ queryKey: ROUTINES_QUERY_KEY })
			queryClient.invalidateQueries({
				queryKey: routineQueryKeys.detail(variables.id),
			})
		},
	})
}

type ToggleCompletedContext = ToggleFavoriteContext

export const useToggleRoutineCompleted = () => {
	const queryClient = useQueryClient()

	return useMutation<
		Routine,
		Error,
		{ id: string; isCompleted: boolean },
		ToggleCompletedContext
	>({
		mutationFn: ({ id, isCompleted }) =>
			routineService.toggleCompleted(id, isCompleted),
		onMutate: async variables => {
			await queryClient.cancelQueries({ queryKey: ROUTINES_QUERY_KEY })

			const previousList =
				queryClient.getQueryData<Routine[]>(ROUTINES_QUERY_KEY)

			queryClient.setQueriesData<Routine[]>(
				{ queryKey: ROUTINES_QUERY_KEY },
				old =>
					(old ?? []).map(r =>
						r.id === variables.id
							? { ...r, isCompleted: variables.isCompleted }
							: r,
					),
			)

			const routineKey = routineQueryKeys.detail(variables.id)
			const previousItem = queryClient.getQueryData<Routine>(routineKey)
			if (previousItem) {
				queryClient.setQueryData<Routine>(routineKey, old =>
					old ? { ...old, isCompleted: variables.isCompleted } : old,
				)
			}

			return { previousList, previousItem }
		},
		onError: (_err, variables, context) => {
			if (context?.previousList) {
				queryClient.setQueryData<Routine[]>(
					ROUTINES_QUERY_KEY,
					context.previousList,
				)
			}
			if (context?.previousItem) {
				queryClient.setQueryData<Routine>(
					routineQueryKeys.detail(variables.id),
					context.previousItem,
				)
			}
		},
		onSettled: (_data, _error, variables) => {
			queryClient.invalidateQueries({ queryKey: ROUTINES_QUERY_KEY })
			queryClient.invalidateQueries({
				queryKey: routineQueryKeys.detail(variables.id),
			})
		},
	})
}

export const useRoutine = (id: string) => {
	return useQuery<Routine, Error>({
		queryKey: routineQueryKeys.detail(id),
		queryFn: () => routineService.getById(id),
		enabled: !!id,
	})
}

export const useDeleteRoutine = () => {
	const queryClient = useQueryClient()

	return useMutation<void, Error, string>({
		mutationFn: (id: string) => routineService.delete(id),
		onSuccess: (_: void, id: string) => {
			queryClient.setQueriesData<Routine[]>(
				{ queryKey: ROUTINES_QUERY_KEY },
				old => (old ?? []).filter(r => r.id !== id),
			)

			queryClient.removeQueries({ queryKey: routineQueryKeys.detail(id) })
			queryClient.invalidateQueries({ queryKey: ROUTINES_QUERY_KEY })
		},
		onError: (error: Error) => {
			logger.error('Error deleting routine:', error)
		},
	})
}

export const useRtFWeekGoals = (routineId: string, week?: number) => {
	return usePerformanceQuery<Routine, Error>(
		{
			queryKey: routineQueryKeys.weekGoals(routineId, week),
			queryFn: async () => {
				const response = await rtfApi.getWeekGoals(routineId, week, {
					maxAge: 3 * 60 * 1000,
				})
				return response.data as Routine
			},
			enabled: !!routineId,
			staleTime: 2 * 60 * 1000,
			gcTime: 10 * 60 * 1000,
		},
		`RTF Week Goals (${routineId}, week: ${week ?? 'current'})`,
	)
}

export const useCreateRoutine = () => {
	const queryClient = useQueryClient()

	return useMutation<Routine, Error, CreateRoutineRequest>({
		mutationFn: (data: CreateRoutineRequest) => routineService.create(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ROUTINES_QUERY_KEY })
		},
	})
}

export const useUpdateRoutine = () => {
	const queryClient = useQueryClient()

	return useMutation<
		Routine,
		Error,
		{ id: string; data: CreateRoutineRequest }
	>({
		mutationFn: ({ id, data }: { id: string; data: CreateRoutineRequest }) =>
			routineService.update(id, data),
		onSuccess: (_: Routine, variables: { id: string }) => {
			queryClient.invalidateQueries({ queryKey: ROUTINES_QUERY_KEY })
			queryClient.invalidateQueries({
				queryKey: routineQueryKeys.detail(variables.id),
			})
		},
	})
}

export const useUpdateExerciseNote = () => {
	const queryClient = useQueryClient()

	return useMutation<
		void,
		Error,
		{ routineId: string; routineExerciseId: string; note: string }
	>({
		mutationFn: ({ routineId, routineExerciseId, note }) =>
			routineService.updateExerciseNote(routineId, routineExerciseId, note),
		onSuccess: (_, { routineId }) => {
			queryClient.invalidateQueries({
				queryKey: routineQueryKeys.detail(routineId),
			})
			queryClient.invalidateQueries({
				queryKey: routineQueryKeys.weekGoals(routineId),
			})
			queryClient.invalidateQueries({ queryKey: ROUTINES_QUERY_KEY })
		},
	})
}
