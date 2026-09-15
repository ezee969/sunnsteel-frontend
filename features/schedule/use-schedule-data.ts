'use client'

import { useEffect, useMemo } from 'react'

import { useRoutines } from '@/lib/api/hooks/useRoutines'
import { useScheduleOverrides } from '@/lib/api/hooks/useScheduleOverrides'
import {
	useActiveSession,
	useSessions,
} from '@/lib/api/hooks/useWorkoutSession'
import { localDateKey } from '@/lib/utils/schedule-week'

/**
 * The reads behind the week and month schedules: the cached routines, the
 * active session and every terminal session in the range. The range is
 * bounded (a week or a month grid), so all its pages are read rather than
 * showing part of it.
 */
export function useScheduleData(range: { from: string; to: string }) {
	const routines = useRoutines()
	const active = useActiveSession()
	// SCHED-06: today's sessions decide where a rotation's plan starts, so a
	// range that begins after today is read from today.
	const read = useMemo(() => {
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		return {
			from: new Date(range.from) > today ? today.toISOString() : range.from,
			to: range.to,
		}
	}, [range.from, range.to])
	const sessions = useSessions({ ...read, sort: 'startedAt:asc', limit: 50 })
	const { hasNextPage, isFetchingNextPage, fetchNextPage } = sessions
	// SCHED-04: the overrides whose date or target falls in the range.
	const overrideRange = useMemo(
		() => ({
			from: localDateKey(new Date(range.from)),
			to: localDateKey(new Date(range.to)),
		}),
		[range.from, range.to],
	)
	const overrides = useScheduleOverrides(overrideRange)

	useEffect(() => {
		if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
	}, [hasNextPage, isFetchingNextPage, fetchNextPage])

	const items = useMemo(
		() => sessions.data?.pages.flatMap(page => page.items),
		[sessions.data],
	)

	return {
		routines: routines.data,
		sessions: items,
		active: active.data,
		overrides: overrides.data?.overrides,
		isPending:
			routines.isPending ||
			sessions.isPending ||
			overrides.isPending ||
			Boolean(hasNextPage) ||
			isFetchingNextPage,
		isError: routines.isError || sessions.isError || overrides.isError,
		refetch: () => {
			void routines.refetch()
			void sessions.refetch()
			void overrides.refetch()
		},
	}
}
