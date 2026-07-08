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
		// RtF was removed from the backend; the rtf-week-goals endpoint now 404s.
		// Only fire when an explicit program week is present, which no longer
		// happens (sessions no longer carry a `program`), so this stays disabled.
		enabled: !!routineId && typeof week === 'number',
		staleTime: 2 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
	}, `RTF Week Goals (${routineId}:${keyWeek})`)
}
