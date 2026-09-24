import {
	type CalendarDate,
	resolveRoutinePlan,
	type RoutineDay,
	routineDayLabel,
	type RoutinePlanSource,
	type RoutineScheduleMode,
	type SessionTemporaryOverride,
	type SessionTrainingBlock,
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

/**
 * ROUT-15: the routine as it trains on `date` -- its active training block's
 * schedule and working-copy days while one covers the date, its baseline
 * otherwise, and a ROUT-16 deload's lighter days over either -- through the
 * contracts' one resolver. Everything that decides
 * what a date trains (schedule, dashboard, the routine page, a start) reads a
 * routine through this rather than reading `days` directly.
 */
export type RoutineOnDate<R> = R & {
	/** The block in force that date, or null for the baseline. */
	trainingBlock:
		(SessionTrainingBlock & { startDate: string; endDate: string }) | null
	/**
	 * ROUT-16: the deload in force that date, or null. Its days replace the
	 * plan's; `trainingBlock` still names the block it lightens.
	 */
	temporaryOverride:
		(SessionTemporaryOverride & { startDate: string; endDate: string }) | null
}

export function routineOn<
	Day,
	R extends RoutinePlanSource<Day> & { days: Day[] },
>(routine: R, date: CalendarDate): RoutineOnDate<R> {
	const plan = resolveRoutinePlan(routine, date)
	return {
		...routine,
		scheduleMode: plan.scheduleMode,
		restDays: plan.restDays,
		rotationWeekdays: plan.rotationWeekdays,
		nextRotationDayId: plan.nextRotationDayId,
		days: plan.days,
		trainingBlock: plan.block,
		temporaryOverride: plan.override,
	}
}

/**
 * ROUT-16: the version of a moved workout's day that the date it lands on
 * trains. A deload lightens the plan it covers without changing its weekdays,
 * so a workout moved into or out of one trains the same weekday's day of the
 * deload or of the plan -- the only one the server starts on that date. Across
 * two different plans (a training block boundary) the planned day stays.
 */
export function landingDay<
	Day extends { dayOfWeek: number | null },
	R extends RoutineOnDate<{ days: Day[] }>,
>(planned: R, landing: R, day: Day): { routine: R; day: Day } {
	const samePlan =
		(planned.trainingBlock?.id ?? null) === (landing.trainingBlock?.id ?? null)
	const sameVersion =
		(planned.temporaryOverride?.id ?? null) ===
		(landing.temporaryOverride?.id ?? null)
	if (!samePlan || sameVersion) return { routine: planned, day }
	const there = landing.days.find(other => other.dayOfWeek === day.dayOfWeek)
	return there ? { routine: landing, day: there } : { routine: planned, day }
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
