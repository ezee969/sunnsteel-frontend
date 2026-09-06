'use client'

import { useMemo } from 'react'

import { useRoutines } from '@/lib/api/hooks/useRoutines'
import {
	useActiveSession,
	useSessions,
} from '@/lib/api/hooks/useWorkoutSession'
import { Routine, RoutineDay } from '@/lib/api/types/routine.type'
import { getTodayDow, validateRoutineDayDate } from '@/lib/utils/date'

export interface TodaysWorkoutEntry {
	routine: Routine
	day: RoutineDay
	canStartToday: boolean
}

/**
 * Everything the dashboard needs to render "Today's Workouts".
 *
 * Lives in a hook (rather than inside the component) so the page can wait on
 * the same queries before revealing anything — TanStack Query dedupes by key,
 * so consuming this twice costs nothing.
 */
export function useTodaysWorkouts() {
	const todayDow = getTodayDow()

	const routinesQuery = useRoutines()
	const activeQuery = useActiveSession()

	// Today's local ISO range, resolved once per mount so the session query key
	// stays stable.
	const { fromISO, toISO } = useMemo(() => {
		const from = new Date()
		from.setHours(0, 0, 0, 0)
		const to = new Date()
		to.setHours(23, 59, 59, 999)
		return { fromISO: from.toISOString(), toISO: to.toISOString() }
	}, [])

	const completedTodayQuery = useSessions({
		status: 'COMPLETED',
		from: fromISO,
		to: toISO,
		sort: 'finishedAt:desc',
		limit: 50,
	})

	const todays = useMemo<TodaysWorkoutEntry[]>(() => {
		return (routinesQuery.data ?? [])
			.map((routine: Routine) => {
				const day = routine.days?.find(
					(d: RoutineDay) => d.dayOfWeek === todayDow,
				)
				if (!day) return null

				// Validate if this routine day can be started today based on
				// scheduling rules
				const { isValid } = validateRoutineDayDate(day)

				return { routine, day, canStartToday: isValid }
			})
			.filter((x): x is TodaysWorkoutEntry => Boolean(x))
	}, [routinesQuery.data, todayDow])

	const completedRoutineIds = useMemo(() => {
		const pages = completedTodayQuery.data?.pages ?? []
		const items = pages.flatMap(p => p.items ?? [])
		return new Set(items.map(i => i.routine.id))
	}, [completedTodayQuery.data])

	// Drop routines that already have a completed session today
	const entries = useMemo(() => {
		if (!todays.length) return todays
		if (!completedRoutineIds.size) return todays
		return todays.filter(({ routine }) => !completedRoutineIds.has(routine.id))
	}, [todays, completedRoutineIds])

	return {
		todayDow,
		entries,
		active: activeQuery.data,
		error: routinesQuery.error,
		isPending:
			routinesQuery.isPending ||
			activeQuery.isPending ||
			completedTodayQuery.isPending,
	}
}
