import {
	type Routine,
	routineDayLabel,
	type WorkoutSession,
	type WorkoutSessionSummary,
} from '@sunsteel/contracts'

import { weekdayName } from './date'
import {
	isRotationRoutine,
	nextRotationDay,
	orderedRoutineDays,
} from './routine-schedule'

/**
 * SCHED-01: one Monday-based week of planned routine days and logged
 * sessions, in the device's time zone. Rules decided 2026-09-14:
 * - a weekly day with no session of its routine that date is "planned" from
 *   today on and "not logged" before it — never "missed" — and only from the
 *   date the routine was created;
 * - rest is neither inferred nor stored (intentional rest is SCHED-07);
 * - rotation days have no date, so they are never planned or not logged: the
 *   week notes each rotation's next day, and its sessions sit on their dates.
 * SCHED-06 (2026-09-15): a rotation with training weekdays is placed on them
 * from today — its next day on the first one without a session of the
 * routine, the following days in order after it — and a past training
 * weekday without a session reads "not logged", with no day name.
 * Planned days follow the routines as they are now.
 */

export type ScheduleSessionStatus = 'COMPLETED' | 'ABORTED' | 'IN_PROGRESS'

export type ScheduleEntry =
	| {
			kind: 'SESSION'
			status: ScheduleSessionStatus
			sessionId: string
			routineId: string
			routineName: string
			dayName: string | null
			startedAt: string
	  }
	| {
			kind: 'PLANNED'
			routineId: string
			routineDayId: string
			routineName: string
			dayName: string
	  }
	| {
			kind: 'NOT_LOGGED'
			routineId: string
			/** Null on a rotation's past training weekday: its day is unknown. */
			routineDayId: string | null
			routineName: string
			dayName: string | null
	  }
	| {
			/** SCHED-07: a weekday the routine rests on by plan. */
			kind: 'REST'
			routineId: string
			routineName: string
			dayName: null
	  }

export interface ScheduleDay {
	/** Local calendar date, YYYY-MM-DD. */
	date: string
	dayOfWeek: number
	isToday: boolean
	isPast: boolean
	entries: ScheduleEntry[]
}

export interface ScheduleRotationNote {
	routineId: string
	routineName: string
	nextDayId: string
	nextDayName: string
}

export interface ScheduleWeek {
	weekStart: string
	/** The week contains today, so today's work can be started from it. */
	includesToday: boolean
	days: ScheduleDay[]
	rotations: ScheduleRotationNote[]
	totals: {
		completed: number
		aborted: number
		planned: number
		notLogged: number
		rest: number
	}
}

const pad = (value: number) => String(value).padStart(2, '0')

export const localDateKey = (date: Date): string =>
	`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const addDays = (date: Date, days: number): Date => {
	const next = new Date(date)
	next.setDate(next.getDate() + days)
	return next
}

/** Local midnight of the Monday that starts `date`'s week. */
export const startOfWeek = (date: Date): Date => {
	const start = new Date(date)
	start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
	start.setHours(0, 0, 0, 0)
	return start
}

/**
 * The sessions read filters terminal sessions by their end, so the range runs
 * one day past the week to keep a session that ended after midnight on the
 * last day; `buildScheduleWeek` places sessions by their start.
 */
export const scheduleWeekRange = (weekStart: Date) => ({
	from: weekStart.toISOString(),
	to: addDays(weekStart, 8).toISOString(),
})

const SESSION_STATUSES = new Set<string>([
	'COMPLETED',
	'ABORTED',
	'IN_PROGRESS',
])

type ScheduleRoutine = Pick<
	Routine,
	| 'id'
	| 'name'
	| 'isCompleted'
	| 'createdAt'
	| 'scheduleMode'
	| 'nextRotationDayId'
	| 'restDays'
	| 'rotationWeekdays'
	| 'days'
>

type ActiveSession = Pick<
	WorkoutSession,
	'id' | 'status' | 'startedAt' | 'routineId' | 'routine' | 'routineDay'
> &
	Partial<Pick<WorkoutSession, 'routineDayId'>>

/** Training weekday dates in [from, to), counted on local calendar days. */
function countTrainingDays(from: Date, to: Date, weekdays: Set<number>) {
	let count = 0
	const end = localDateKey(to)
	for (let day = from; localDateKey(day) < end; day = addDays(day, 1)) {
		if (weekdays.has(day.getDay())) count += 1
	}
	return count
}

/**
 * SCHED-06: a rotation on training weekdays over the week's dates. From today
 * its days follow in order on the training weekdays, starting with its next
 * day on the first one without a session of the routine; a live session
 * trains that day now, so the plan continues after it. A past training
 * weekday without a session is "not logged", with no day name.
 */
function planRotation(
	routine: ScheduleRoutine,
	{
		days,
		now,
		trained,
		trainedToday,
		activeDayId,
	}: {
		days: readonly ScheduleDay[]
		now: Date
		trained: ReadonlySet<string>
		trainedToday: boolean
		activeDayId: string | null
	},
): Array<{ date: string; entry: ScheduleEntry }> {
	const weekdays = new Set(routine.rotationWeekdays)
	const ordered = orderedRoutineDays(routine)
	const next = nextRotationDay(routine)
	if (!next || ordered.length === 0) return []
	const today = localDateKey(now)
	const createdOn = localDateKey(new Date(routine.createdAt))
	let start = ordered.findIndex(day => day.id === next.id)
	if (activeDayId === next.id) start += 1
	let first = new Date(now.getFullYear(), now.getMonth(), now.getDate())
	if (trainedToday) first = addDays(first, 1)
	while (!weekdays.has(first.getDay())) first = addDays(first, 1)
	const firstKey = localDateKey(first)

	const plan: Array<{ date: string; entry: ScheduleEntry }> = []
	for (const day of days) {
		if (!weekdays.has(day.dayOfWeek)) continue
		if (trained.has(`${routine.id}|${day.date}`)) continue
		if (day.date < today) {
			if (day.date < createdOn) continue
			plan.push({
				date: day.date,
				entry: {
					kind: 'NOT_LOGGED',
					routineId: routine.id,
					routineDayId: null,
					routineName: routine.name,
					dayName: null,
				},
			})
			continue
		}
		if (day.date < firstKey) continue
		const slot = countTrainingDays(first, fromKey(day.date), weekdays)
		const routineDay = ordered[(start + slot) % ordered.length]
		plan.push({
			date: day.date,
			entry: {
				kind: 'PLANNED',
				routineId: routine.id,
				routineDayId: routineDay.id,
				routineName: routine.name,
				dayName: routineDayLabel(routineDay),
			},
		})
	}
	return plan
}

export function buildScheduleWeek({
	weekStart,
	now,
	routines,
	sessions,
	active,
}: {
	weekStart: Date
	now: Date
	routines: readonly ScheduleRoutine[]
	sessions: readonly WorkoutSessionSummary[]
	active?: ActiveSession | null
}): ScheduleWeek {
	const today = localDateKey(now)
	const days: ScheduleDay[] = Array.from({ length: 7 }, (_, index) => {
		const date = addDays(weekStart, index)
		const key = localDateKey(date)
		return {
			date: key,
			dayOfWeek: date.getDay(),
			isToday: key === today,
			isPast: key < today,
			entries: [],
		}
	})
	const byDate = new Map(days.map(day => [day.date, day]))
	const trained = new Set<string>()

	const sessionEntries: Array<ScheduleEntry & { kind: 'SESSION' }> = []
	for (const session of sessions) {
		if (!SESSION_STATUSES.has(session.status)) continue
		sessionEntries.push({
			kind: 'SESSION',
			status: session.status as ScheduleSessionStatus,
			sessionId: session.id,
			routineId: session.routine.id,
			routineName: session.routine.name,
			dayName: session.routine.dayName || null,
			startedAt: session.startedAt,
		})
	}
	if (
		active?.status === 'IN_PROGRESS' &&
		!sessionEntries.some(entry => entry.sessionId === active.id)
	) {
		sessionEntries.push({
			kind: 'SESSION',
			status: 'IN_PROGRESS',
			sessionId: active.id,
			routineId: active.routineId,
			routineName: active.routine?.name ?? 'Workout',
			dayName: active.routineDay
				? routineDayLabel(active.routineDay) || null
				: null,
			startedAt: active.startedAt,
		})
	}
	sessionEntries.sort((a, b) => a.startedAt.localeCompare(b.startedAt))
	// SCHED-06: today's sessions decide where a rotation's plan starts, even
	// when today is outside this week.
	const trainedToday = new Set(
		sessionEntries
			.filter(entry => localDateKey(new Date(entry.startedAt)) === today)
			.map(entry => entry.routineId),
	)
	for (const entry of sessionEntries) {
		const date = localDateKey(new Date(entry.startedAt))
		const day = byDate.get(date)
		if (!day) continue
		day.entries.push(entry)
		trained.add(`${entry.routineId}|${date}`)
	}

	const planned: Array<{ date: string; entry: ScheduleEntry }> = []
	const rotations: ScheduleRotationNote[] = []
	for (const routine of routines) {
		if (routine.isCompleted) continue
		if (isRotationRoutine(routine) && routine.rotationWeekdays?.length) {
			planned.push(
				...planRotation(routine, {
					days,
					now,
					trained,
					trainedToday: trainedToday.has(routine.id),
					activeDayId:
						active?.status === 'IN_PROGRESS' && active.routineId === routine.id
							? (active.routineDayId ?? null)
							: null,
				}),
			)
			continue
		}
		if (isRotationRoutine(routine)) {
			const next = nextRotationDay(routine)
			if (next) {
				rotations.push({
					routineId: routine.id,
					routineName: routine.name,
					nextDayId: next.id,
					nextDayName: routineDayLabel(next),
				})
			}
			continue
		}
		const createdOn = localDateKey(new Date(routine.createdAt))
		for (const routineDay of routine.days) {
			if (routineDay.dayOfWeek === null) continue
			const day = days.find(d => d.dayOfWeek === routineDay.dayOfWeek)
			if (!day || day.date < createdOn) continue
			if (trained.has(`${routine.id}|${day.date}`)) continue
			planned.push({
				date: day.date,
				entry: {
					kind: day.isPast ? 'NOT_LOGGED' : 'PLANNED',
					routineId: routine.id,
					routineDayId: routineDay.id,
					routineName: routine.name,
					dayName: routineDayLabel(routineDay),
				},
			})
		}
		// SCHED-07: planned rest is never "not logged"; a session replaces it.
		for (const weekday of routine.restDays ?? []) {
			const day = days.find(d => d.dayOfWeek === weekday)
			if (!day || day.date < createdOn) continue
			if (trained.has(`${routine.id}|${day.date}`)) continue
			planned.push({
				date: day.date,
				entry: {
					kind: 'REST',
					routineId: routine.id,
					routineName: routine.name,
					dayName: null,
				},
			})
		}
	}
	planned
		.sort(
			(a, b) =>
				Number(a.entry.kind === 'REST') - Number(b.entry.kind === 'REST') ||
				a.entry.routineName.localeCompare(b.entry.routineName, undefined, {
					sensitivity: 'base',
				}),
		)
		.forEach(({ date, entry }) => byDate.get(date)?.entries.push(entry))

	const all = days.flatMap(day => day.entries)
	const count = (predicate: (entry: ScheduleEntry) => boolean) =>
		all.filter(predicate).length

	return {
		weekStart: localDateKey(weekStart),
		includesToday: days.some(day => day.isToday),
		days,
		// A rotation's next day only matters for a week that is not over.
		rotations: days[6].date >= today ? rotations : [],
		totals: {
			completed: count(e => e.kind === 'SESSION' && e.status === 'COMPLETED'),
			aborted: count(e => e.kind === 'SESSION' && e.status === 'ABORTED'),
			planned: count(e => e.kind === 'PLANNED'),
			notLogged: count(e => e.kind === 'NOT_LOGGED'),
			rest: count(e => e.kind === 'REST'),
		},
	}
}

export type ScheduleAction =
	| { kind: 'START'; routineId: string; routineDayId: string }
	| { kind: 'RESUME'; sessionId: string }
	| null

/**
 * SCHED-03: what an entry lets you do now, under the rules the routine card
 * and dashboard already apply. The live session can be resumed. A weekly day
 * starts only on its date — today — and nothing starts while a session is
 * live, because starting would silently resume that one instead.
 */
export function scheduleEntryAction(
	entry: ScheduleEntry,
	day: Pick<ScheduleDay, 'isToday'>,
	hasActiveSession: boolean,
): ScheduleAction {
	if (entry.kind === 'SESSION') {
		return entry.status === 'IN_PROGRESS'
			? { kind: 'RESUME', sessionId: entry.sessionId }
			: null
	}
	if (entry.kind === 'PLANNED' && day.isToday && !hasActiveSession) {
		return {
			kind: 'START',
			routineId: entry.routineId,
			routineDayId: entry.routineDayId,
		}
	}
	return null
}

/** A rotation's next day starts on any day of the current week. */
export function rotationStartAction(
	note: ScheduleRotationNote,
	week: Pick<ScheduleWeek, 'includesToday'>,
	hasActiveSession: boolean,
): ScheduleAction {
	return week.includesToday && !hasActiveSession
		? { kind: 'START', routineId: note.routineId, routineDayId: note.nextDayId }
		: null
}

/** "2 completed · 1 ended early · 3 planned · 1 not logged", zeros omitted. */
export function describeScheduleTotals(totals: ScheduleWeek['totals']): string {
	const parts = [
		totals.completed ? `${totals.completed} completed` : null,
		totals.aborted ? `${totals.aborted} ended early` : null,
		totals.planned ? `${totals.planned} planned` : null,
		totals.notLogged ? `${totals.notLogged} not logged` : null,
		totals.rest
			? `${totals.rest} rest ${totals.rest === 1 ? 'day' : 'days'}`
			: null,
	].filter(Boolean)
	return parts.length ? parts.join(' · ') : 'Nothing planned or logged'
}

const WEEK_FORMAT = new Intl.DateTimeFormat(undefined, {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
})
const DAY_FORMAT = new Intl.DateTimeFormat(undefined, {
	day: 'numeric',
	month: 'short',
})

const fromKey = (key: string) => {
	const [year, month, day] = key.split('-').map(Number)
	return new Date(year, month - 1, day)
}

export function describeWeek(weekStart: string, now: Date): string {
	const current = localDateKey(startOfWeek(now))
	if (weekStart === current) return 'This week'
	if (weekStart === localDateKey(addDays(fromKey(current), -7))) {
		return 'Last week'
	}
	if (weekStart === localDateKey(addDays(fromKey(current), 7))) {
		return 'Next week'
	}
	return `Week of ${WEEK_FORMAT.format(fromKey(weekStart))}`
}

export const describeScheduleDay = (day: ScheduleDay) => ({
	weekday: weekdayName(day.dayOfWeek, 'long'),
	date: DAY_FORMAT.format(fromKey(day.date)),
})
