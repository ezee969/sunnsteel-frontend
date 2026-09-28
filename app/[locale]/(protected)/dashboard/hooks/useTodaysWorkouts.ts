'use client'

import { useMemo } from 'react'

import { useRoutines } from '@/lib/api/hooks/useRoutines'
import { useScheduleOverrides } from '@/lib/api/hooks/useScheduleOverrides'
import {
	useActiveSession,
	useSessions,
} from '@/lib/api/hooks/useWorkoutSession'
import { Routine, RoutineDay } from '@/lib/api/types/routine.type'
import { getTodayDow, validateRoutineDayDate } from '@/lib/utils/date'
import {
	isRotationRoutine,
	landingDay,
	routineOn,
	type RoutineOnDate,
	startableDayToday,
} from '@/lib/utils/routine-schedule'
import { localDateKey } from '@/lib/utils/schedule-week'
import { trainableDays } from '@/lib/utils/train-another-day'

export interface TodaysWorkoutEntry {
	/**
	 * ROUT-15: the routine as it trains on the entry's date -- its training
	 * block's schedule and days while one is in force -- so `day` is a day of
	 * the plan the server will accept and `routine.trainingBlock` names it.
	 */
	routine: RoutineOnDate<Routine>
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

	// SCHED-04: today's moves, away from today and onto it.
	const todayKey = useMemo(() => localDateKey(new Date()), [])
	const overridesQuery = useScheduleOverrides({ from: todayKey, to: todayKey })

	const todays = useMemo<TodaysWorkoutEntry[]>(() => {
		const moves = (overridesQuery.data?.overrides ?? []).filter(
			move => move.kind === 'MOVE' && move.toDate,
		)
		const planned = (routinesQuery.data ?? [])
			.map(baseline => routineOn(baseline, todayKey))
			.map(routine => {
				// ROUT-11: a rotation offers its next day on any weekday.
				const day = startableDayToday(routine, todayDow)
				if (!day) return null
				if (
					!isRotationRoutine(routine) &&
					// Moved away (SCHED-04) or skipped (SCHED-05) today.
					(overridesQuery.data?.overrides ?? []).some(
						o => o.routineId === routine.id && o.date === todayKey,
					)
				) {
					return null
				}
				// SCHED-06: a rotation on training weekdays is today's work only on
				// them; it can still be started from its routine on any day.
				if (
					isRotationRoutine(routine) &&
					routine.rotationWeekdays?.length &&
					!routine.rotationWeekdays.includes(todayDow)
				) {
					return null
				}

				// Validate if this routine day can be started today based on
				// scheduling rules
				const { isValid } = validateRoutineDayDate(day)

				return { routine, day, canStartToday: isValid }
			})
			.filter((x): x is TodaysWorkoutEntry => Boolean(x))
		// A workout moved onto today is today's work, whatever its weekday.
		const movedIn = moves.flatMap(move => {
			if (move.toDate !== todayKey) return []
			const baseline = routinesQuery.data?.find(r => r.id === move.routineId)
			if (!baseline || baseline.isCompleted) return []
			// ROUT-15: the moved day is the one the plan on its own date had;
			// ROUT-16: in the version today trains when a deload starts or ends
			// between the two dates.
			const plannedOn = routineOn(baseline, move.date)
			if (isRotationRoutine(plannedOn)) return []
			const [year, month, date] = move.date.split('-').map(Number)
			const weekday = new Date(year, month - 1, date).getDay()
			const plannedDay = plannedOn.days.find(d => d.dayOfWeek === weekday)
			if (
				!plannedDay ||
				planned.some(entry => entry.routine.id === plannedOn.id)
			) {
				return []
			}
			const { routine, day } = landingDay(
				plannedOn,
				routineOn(baseline, todayKey),
				plannedDay,
			)
			return [{ routine, day, canStartToday: true }]
		})
		return [...planned, ...movedIn]
	}, [routinesQuery.data, overridesQuery.data, todayDow, todayKey])

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

	// The query sorts by finish time, so the first item is today's latest
	// completed workout — the one DASH-02 offers to review.
	const completedToday = completedTodayQuery.data?.pages[0]?.items?.[0] ?? null

	return {
		todayDow,
		entries,
		active: activeQuery.data,
		completedToday,
		// LIVE-06: whether anything could be trained at all, which decides
		// between offering a day and sending the owner to the routine list.
		hasTrainableDay:
			trainableDays(routinesQuery.data, todayDow, todayKey).length > 0,
		error: routinesQuery.error,
		isPending:
			routinesQuery.isPending ||
			activeQuery.isPending ||
			completedTodayQuery.isPending ||
			overridesQuery.isPending,
	}
}
