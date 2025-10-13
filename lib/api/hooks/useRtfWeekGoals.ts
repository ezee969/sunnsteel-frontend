import { usePerformanceQuery } from '@/hooks/use-performance-query'
import { rtfApi } from '../etag-client'
import type { RtfWeekGoals } from '../types/rtf.types'

export const useRtfWeekGoals = (
	routineId: string,
	week?: number,
	options?: { maxAgeMs?: number },
) => {
	const keyWeek = typeof week === 'number' ? String(week) : 'current'
	return usePerformanceQuery<RtfWeekGoals, Error>({
		queryKey: ['rtf', 'week-goals', routineId, keyWeek],
		queryFn: async () => {
			const res = await rtfApi.getWeekGoals(routineId, week, {
				maxAge: options?.maxAgeMs ?? 5 * 60 * 1000,
			})
			return res.data as RtfWeekGoals
		},
		enabled: !!routineId,
		staleTime: 2 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
	}, `RTF Week Goals (${routineId}:${keyWeek})`)
}
