import type { RoutineVersionsResponse } from '@sunsteel/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { routineQueryKeys } from '../routines/routine-query'
import { routineService } from '../services/routineService'
import type { Routine } from '../types/routine.type'

/** ROUT-08: a routine's saved versions, newest first. */
export const useRoutineVersions = (routineId: string) =>
	useQuery<RoutineVersionsResponse, Error>({
		queryKey: routineQueryKeys.versions(routineId),
		queryFn: () => routineService.getVersions(routineId),
		enabled: !!routineId,
	})

export const useCreateRoutineVersion = (routineId: string) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (name: string | null) =>
			routineService.createVersion(routineId, { name }),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: routineQueryKeys.versions(routineId),
			}),
	})
}

/**
 * Restoring replaces the routine: the response's routine goes straight into
 * the detail cache, and every routine read (lists included) refetches.
 */
export const useRestoreRoutineVersion = (routineId: string) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (versionId: string) =>
			routineService.restoreVersion(routineId, versionId),
		onSuccess: ({ routine }) => {
			queryClient.setQueryData<Routine>(
				routineQueryKeys.detail(routineId),
				routine,
			)
			return Promise.all([
				queryClient.invalidateQueries({ queryKey: routineQueryKeys.all() }),
				queryClient.invalidateQueries({
					queryKey: routineQueryKeys.versions(routineId),
				}),
			])
		},
	})
}

export const useDeleteRoutineVersion = (routineId: string) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (versionId: string) =>
			routineService.deleteVersion(routineId, versionId),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: routineQueryKeys.versions(routineId),
			}),
	})
}
