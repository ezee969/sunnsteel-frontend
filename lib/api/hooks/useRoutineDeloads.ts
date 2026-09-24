import type {
	CreateDeloadRequest,
	RoutineTemporaryOverridesResponse,
} from '@sunsteel/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { routineQueryKeys } from '../routines/routine-query'
import { routineService } from '../services/routineService'

/** ROUT-16: a routine's deloads, newest start first. */
export const useRoutineDeloads = (routineId: string) =>
	useQuery<RoutineTemporaryOverridesResponse, Error>({
		queryKey: routineQueryKeys.deloads(routineId),
		queryFn: () => routineService.getDeloads(routineId),
		enabled: !!routineId,
	})

/**
 * A deload changes what its dates train, and the routine read carries it, so
 * every write refreshes the routines (lists, detail, the schedule and the
 * dashboard read them) as well as the deload list.
 */
function useInvalidateDeloads(routineId: string) {
	const queryClient = useQueryClient()
	return () =>
		Promise.all([
			queryClient.invalidateQueries({
				queryKey: routineQueryKeys.deloads(routineId),
			}),
			queryClient.invalidateQueries({ queryKey: routineQueryKeys.all() }),
		])
}

export const useCreateDeload = (routineId: string) => {
	const invalidate = useInvalidateDeloads(routineId)
	return useMutation({
		mutationFn: (data: CreateDeloadRequest) =>
			routineService.createDeload(routineId, data),
		onSuccess: invalidate,
	})
}

export const useEndDeloadEarly = (routineId: string) => {
	const invalidate = useInvalidateDeloads(routineId)
	return useMutation({
		mutationFn: (deloadId: string) =>
			routineService.endDeloadEarly(routineId, deloadId),
		onSuccess: invalidate,
	})
}

export const useCancelDeload = (routineId: string) => {
	const invalidate = useInvalidateDeloads(routineId)
	return useMutation({
		mutationFn: (deloadId: string) =>
			routineService.cancelDeload(routineId, deloadId),
		onSuccess: invalidate,
	})
}
