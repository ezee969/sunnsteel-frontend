import type {
	RoutineTrainingBlockRevisionsResponse,
	RoutineTrainingBlocksResponse,
	TrainingBlockComparisonResponse,
	UpsertRoutineTrainingBlockRequest,
} from '@sunsteel/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { routineQueryKeys } from '../routines/routine-query'
import { routineService } from '../services/routineService'

/** ROUT-09: the current, ordered authored blocks of one routine. */
export const useRoutineTrainingBlocks = (routineId: string) =>
	useQuery<RoutineTrainingBlocksResponse, Error>({
		queryKey: routineQueryKeys.trainingBlocks(routineId),
		queryFn: () => routineService.getTrainingBlocks(routineId),
		enabled: !!routineId,
	})

/**
 * PROG-11: read when the comparison opens, and never served stale, because a
 * workout finished since would change it and nothing here is invalidated by it.
 */
export const useTrainingBlockComparison = (
	routineId: string,
	seriesId: string | null,
) =>
	useQuery<TrainingBlockComparisonResponse, Error>({
		queryKey: routineQueryKeys.trainingBlockComparison(
			routineId,
			seriesId ?? 'closed',
		),
		queryFn: () =>
			routineService.getTrainingBlockComparison(routineId, seriesId!),
		enabled: !!routineId && !!seriesId,
		staleTime: 0,
	})

export const useRoutineTrainingBlockRevisions = (
	routineId: string,
	blockId: string | null,
) =>
	useQuery<RoutineTrainingBlockRevisionsResponse, Error>({
		queryKey: routineQueryKeys.trainingBlockRevisions(
			routineId,
			blockId ?? 'closed',
		),
		queryFn: () =>
			routineService.getTrainingBlockRevisions(routineId, blockId!),
		enabled: !!routineId && !!blockId,
	})

/**
 * ROUT-15: the routine read carries the current blocks, which decide what
 * each date trains, so a block write refreshes the routines too.
 */
function useInvalidateTrainingBlocks(routineId: string) {
	const queryClient = useQueryClient()
	return () =>
		Promise.all([
			queryClient.invalidateQueries({
				queryKey: routineQueryKeys.trainingBlocksAll(routineId),
			}),
			queryClient.invalidateQueries({ queryKey: routineQueryKeys.all() }),
		])
}

export const useCreateRoutineTrainingBlock = (routineId: string) => {
	const invalidate = useInvalidateTrainingBlocks(routineId)
	return useMutation({
		mutationFn: (data: UpsertRoutineTrainingBlockRequest) =>
			routineService.createTrainingBlock(routineId, data),
		onSuccess: invalidate,
	})
}

export const useUpdateRoutineTrainingBlock = (routineId: string) => {
	const invalidate = useInvalidateTrainingBlocks(routineId)
	return useMutation({
		mutationFn: ({
			blockId,
			data,
		}: {
			blockId: string
			data: UpsertRoutineTrainingBlockRequest
		}) => routineService.updateTrainingBlock(routineId, blockId, data),
		onSuccess: invalidate,
	})
}

export const useDeleteRoutineTrainingBlock = (routineId: string) => {
	const invalidate = useInvalidateTrainingBlocks(routineId)
	return useMutation({
		mutationFn: (blockId: string) =>
			routineService.deleteTrainingBlock(routineId, blockId),
		onSuccess: invalidate,
	})
}
