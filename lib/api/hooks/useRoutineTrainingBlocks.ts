import type {
	RoutineTrainingBlockRevisionsResponse,
	RoutineTrainingBlocksResponse,
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

function useInvalidateTrainingBlocks(routineId: string) {
	const queryClient = useQueryClient()
	return () =>
		queryClient.invalidateQueries({
			queryKey: routineQueryKeys.trainingBlocksAll(routineId),
		})
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
