import type { Routine } from '@sunsteel/contracts'
import { routineDayLabel } from '@sunsteel/contracts'

import { routineOn } from './routine-schedule'
import { localDateKey } from './schedule-week'

/**
 * LIVE-06. Training a day that is not today's plan.
 *
 * This is **not** a new capability. `startSession` validates that you own the
 * routine day and nothing about the date, and the routine detail page has
 * always been able to start a specific day — it was simply four taps deep,
 * behind Routines and a routine. What this adds is the route to it from where
 * the need arises.
 *
 * It is also deliberately not the old Quick Workout, which created a routine
 * whose only day had no exercises and opened a session with nothing loggable.
 * Every day offered here carries a real prescription, so the session it starts
 * still produces progression, records and analytics that mean something.
 */
export type TrainableDay = {
	routineId: string
	routineName: string
	dayId: string
	dayLabel: string
	exerciseCount: number
	/** True when this day is part of today's plan, which is offered first. */
	isToday: boolean
	/** ROUT-15: the training block in force today, when the day is one of its. */
	trainingBlockName?: string
}

/**
 * Every day the owner could train right now, newest routine first and in each
 * routine's own day order.
 *
 * **A day with no exercises is left out.** Starting one is exactly the bug
 * `FIX-04` hid: a session with nothing to log and no way to add anything.
 * A completed routine is left out as well, matching `routinesPlannedOn` on the
 * server, which skips one when deciding what a day plans.
 *
 * ROUT-15: while a training block is in force, its days are the ones offered;
 * the server refuses a day of any other plan, so offering one would fail.
 */
export function trainableDays(
	routines: Routine[] | undefined,
	todayDow: number,
	today: string = localDateKey(new Date()),
): TrainableDay[] {
	if (!routines?.length) return []

	return routines
		.filter(routine => !routine.isCompleted)
		.map(routine => routineOn(routine, today))
		.flatMap(routine =>
			[...(routine.days ?? [])]
				.sort((a, b) => a.order - b.order)
				.filter(day => (day.exercises?.length ?? 0) > 0)
				.map(day => ({
					routineId: routine.id,
					routineName: routine.name,
					dayId: day.id,
					dayLabel: routineDayLabel(day),
					exerciseCount: day.exercises.length,
					// A rotation day has no weekday, so it is never "today's" by
					// the calendar; the schedule decides that, not this list.
					isToday: day.dayOfWeek === todayDow,
					...(routine.trainingBlock
						? { trainingBlockName: routine.trainingBlock.name }
						: {}),
				})),
		)
		.sort((a, b) => Number(b.isToday) - Number(a.isToday))
}

/** Copy for the empty case, which is a different problem from an empty day. */
export const TRAIN_ANOTHER_DAY_EMPTY =
	'No routine of yours has a day with exercises in it yet. Build one first — a workout with nothing in it cannot be logged.'

export const TRAIN_ANOTHER_DAY_DESCRIPTION =
	'Start any day from your routines, whether or not it is planned for today. It counts the same: the same prescription, progression and records.'
