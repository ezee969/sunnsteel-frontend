import {
	type RoutineDay,
	routineDayLabel,
	type RoutineScheduleMode,
} from '@sunsteel/contracts'

import { weekdayName } from './date'

/**
 * ROUT-11: how a routine's days are scheduled. A WEEKLY day trains on its
 * weekday; a ROTATION day has none — the routine offers the day after the
 * last completed session (`nextRotationDayId`), and any day can be started.
 */

type ScheduledDay = Pick<RoutineDay, 'id' | 'dayOfWeek' | 'name' | 'order'>

interface ScheduledRoutine<Day extends ScheduledDay = ScheduledDay> {
	scheduleMode: RoutineScheduleMode
	nextRotationDayId: string | null
	days: readonly Day[]
}

export const isRotationRoutine = (routine: {
	scheduleMode: RoutineScheduleMode
}): boolean => routine.scheduleMode === 'ROTATION'

/** Days in the order the routine runs them. */
export function orderedRoutineDays<Day extends ScheduledDay>(
	routine: Pick<ScheduledRoutine<Day>, 'days'>,
): Day[] {
	return [...routine.days].sort(
		(a, b) => a.order - b.order || (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0),
	)
}

/** The rotation's next day, falling back to its first. */
export function nextRotationDay<Day extends ScheduledDay>(
	routine: ScheduledRoutine<Day>,
): Day | null {
	if (!isRotationRoutine(routine)) return null
	return (
		routine.days.find(day => day.id === routine.nextRotationDayId) ??
		orderedRoutineDays(routine)[0] ??
		null
	)
}

/**
 * The day a routine offers to start today: the rotation's next day, or the
 * weekly day on today's weekday (none when it does not train today).
 */
export function startableDayToday<Day extends ScheduledDay>(
	routine: ScheduledRoutine<Day>,
	todayDow: number,
): Day | null {
	if (isRotationRoutine(routine)) return nextRotationDay(routine)
	return routine.days.find(day => day.dayOfWeek === todayDow) ?? null
}

/**
 * A day's heading: "Push" or "Day B" on a rotation; the weekday on a weekly
 * routine, followed by the day's own name when it has one.
 */
export function routineDayTitle(
	day: Pick<ScheduledDay, 'dayOfWeek' | 'name' | 'order'>,
	style: 'short' | 'long' = 'long',
): string {
	if (day.dayOfWeek === null) return routineDayLabel(day)
	const weekday = weekdayName(day.dayOfWeek, style)
	const name = day.name?.trim()
	return name ? `${weekday} · ${name}` : weekday
}

/** The one-line schedule on a routine card. */
export function describeRoutineSchedule(
	routine: Pick<ScheduledRoutine, 'scheduleMode' | 'days'> & {
		restDays?: readonly number[]
		rotationWeekdays?: readonly number[]
	},
): string {
	const days = orderedRoutineDays(routine)
	if (isRotationRoutine(routine)) {
		// SCHED-06: the weekdays a rotation trains on follow its days.
		const weekdays = routine.rotationWeekdays?.length
			? ` · ${routine.rotationWeekdays.map(day => weekdayName(day, 'short')).join(', ')}`
			: ''
		return (
			['Rotation', ...days.map(day => routineDayLabel(day))].join(' · ') +
			weekdays
		)
	}
	const training = days
		.map(day => weekdayName(day.dayOfWeek ?? 0, 'short'))
		.join(' · ')
	// SCHED-07: planned rest follows the training days.
	const rest = routine.restDays?.length
		? ` · Rest ${routine.restDays.map(day => weekdayName(day, 'short')).join(', ')}`
		: ''
	return training + rest
}

/** "3 days/week" for a weekly routine, "3-day rotation" for a rotation. */
export function describeRoutineFrequency(
	routine: Pick<ScheduledRoutine, 'scheduleMode' | 'days'>,
	formatDaysPerWeek: (days: number) => string,
): string {
	return isRotationRoutine(routine)
		? `${routine.days.length}-day rotation`
		: formatDaysPerWeek(routine.days.length)
}
