'use client'

import { useEffect, useMemo } from 'react'

import { useRoutines } from '@/lib/api/hooks/useRoutines'
import {
	useActiveSession,
	useSessions,
} from '@/lib/api/hooks/useWorkoutSession'

/**
 * The reads behind the week and month schedules: the cached routines, the
 * active session and every terminal session in the range. The range is
 * bounded (a week or a month grid), so all its pages are read rather than
 * showing part of it.
 */
export function useScheduleData(range: { from: string; to: string }) {
	const routines = useRoutines()
	const active = useActiveSession()
	const sessions = useSessions({ ...range, sort: 'startedAt:asc', limit: 50 })
	const { hasNextPage, isFetchingNextPage, fetchNextPage } = sessions

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
		isPending:
			routines.isPending ||
			sessions.isPending ||
			Boolean(hasNextPage) ||
			isFetchingNextPage,
		isError: routines.isError || sessions.isError,
		refetch: () => {
			void routines.refetch()
			void sessions.refetch()
		},
	}
}
