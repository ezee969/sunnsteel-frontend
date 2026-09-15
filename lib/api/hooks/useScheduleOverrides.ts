import type {
	MoveOccurrenceRequest,
	ScheduleOverridesQuery,
	ScheduleOverridesResponse,
} from '@sunsteel/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { scheduleService } from '../services/scheduleService'

export const scheduleOverrideKeys = {
	all: () => ['schedule-overrides'] as const,
	range: ({ from, to }: ScheduleOverridesQuery) =>
		[...scheduleOverrideKeys.all(), from, to] as const,
}

/** SCHED-04: the owner's overrides whose date or target falls in the range. */
export const useScheduleOverrides = (range: ScheduleOverridesQuery) =>
	useQuery<ScheduleOverridesResponse, Error>({
		queryKey: scheduleOverrideKeys.range(range),
		queryFn: () => scheduleService.getOverrides(range),
	})

/** Moves stay pending until every overrides read has refetched. */
export const useMoveOccurrence = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: MoveOccurrenceRequest) =>
			scheduleService.moveOccurrence(data),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: scheduleOverrideKeys.all() }),
	})
}

export const useUndoMove = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => scheduleService.removeOverride(id),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: scheduleOverrideKeys.all() }),
	})
}
