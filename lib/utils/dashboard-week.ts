import type { Locale } from '@/i18n/config'
import type { Translator } from '@/i18n/translator'

import { weekdayName } from './date'
import {
	describeMonthCell,
	type ScheduleDayState,
	scheduleDayState,
} from './schedule-month'
import type { ScheduleDay, ScheduleEntry, ScheduleWeek } from './schedule-week'

/**
 * DASH-03: the dashboard's weekly strip is a placement of what already
 * exists. Each day is the SCHED-01 week builder's own day and its mark is the
 * month view's strongest state, so the strip can never read a day differently
 * from /schedule; today's line is the dashboard's own today read.
 */

export const WEEK_STRIP_SCHEDULE_HREF = '/schedule'

export interface WeekStripDay {
	date: string
	/** "Mon". */
	weekday: string
	dayOfMonth: number
	isToday: boolean
	state: ScheduleDayState
	href: string
	/** The day as the month view names it, plus where the link goes. */
	label: string
}

type SessionEntry = Extract<ScheduleEntry, { kind: 'SESSION' }>

/**
 * A day opens its workout when it has one -- the live session first, then
 * the latest completed, then the latest ended early -- and the schedule
 * otherwise, where a planned day is started, moved or skipped.
 */
export function weekStripHref(day: Pick<ScheduleDay, 'entries'>): string {
	const sessions = day.entries
		.filter((entry): entry is SessionEntry => entry.kind === 'SESSION')
		.sort((a, b) => b.startedAt.localeCompare(a.startedAt))
	const live = sessions.find(session => session.status === 'IN_PROGRESS')
	if (live) return `/workouts/sessions/${live.sessionId}`
	const finished =
		sessions.find(session => session.status === 'COMPLETED') ?? sessions[0]
	return finished
		? `/workouts/history/${finished.sessionId}`
		: WEEK_STRIP_SCHEDULE_HREF
}

export function buildWeekStrip(
	week: ScheduleWeek,
	tDate: Translator<'routines.date'>,
	locale: Locale,
	t: Translator<'planning.weekStrip'>,
	tMonth: Translator<'planning.scheduleMonth'>,
): WeekStripDay[] {
	return week.days.map(day => {
		const href = weekStripHref(day)
		const destination = href.startsWith('/workouts/sessions/')
			? t('opensInProgress')
			: href.startsWith('/workouts/history/')
				? t('opensWorkout')
				: t('opensSchedule')
		return {
			date: day.date,
			weekday: weekdayName(day.dayOfWeek, 'short', tDate),
			dayOfMonth: Number(day.date.slice(8)),
			isToday: day.isToday,
			state: scheduleDayState(day),
			href,
			label: t('dayLabel', {
				cell: describeMonthCell(day, locale, tMonth),
				destination,
			}),
		}
	})
}

/** The states the strip shows, in the order the schedule's legend uses. */
export function weekStripStates(days: WeekStripDay[]): ScheduleDayState[] {
	const present = new Set(days.map(day => day.state))
	const order: ScheduleDayState[] = [
		'COMPLETED',
		'ABORTED',
		'IN_PROGRESS',
		'PLANNED',
		'NOT_LOGGED',
		'REST',
		'MOVED',
		'SKIPPED',
	]
	return order.filter(state => present.has(state))
}

/**
 * Today's line comes from `useTodaysWorkouts`, the read the Today's Workouts
 * card above uses, so the two never disagree about what is left to train.
 */
export function describeWeekStripToday(
	{
		hasActiveSession,
		remaining,
		trainedToday,
	}: {
		hasActiveSession: boolean
		remaining: number
		trainedToday: boolean
	},
	t: Translator<'planning.weekStrip'>,
): string | null {
	if (hasActiveSession) return t('todayInProgress')
	if (remaining > 0) return t('todayLeft', { count: remaining })
	if (trainedToday) return t('todayTrained')
	return null
}
