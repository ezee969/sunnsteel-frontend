import {
	type Routine,
	routineDayLabel,
	type WorkoutSession,
	type WorkoutSessionSummary,
} from '@sunsteel/contracts'

import { weekdayName } from './date'
import { isRotationRoutine, nextRotationDay } from './routine-schedule'

/**
 * SCHED-01: one Monday-based week of planned routine days and logged
 * sessions, in the device's time zone. Rules decided 2026-09-14:
 * - a weekly day with no session of its routine that date is "planned" from
 *   today on and "not logged" before it — never "missed" — and only from the
 *   date the routine was created;
 * - rest is neither inferred nor stored (intentional rest is SCHED-07);
 * - rotation days have no date, so they are never planned or not logged: the
 *   week notes each rotation's next day, and its sessions sit on their dates.
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
			kind: 'PLANNED' | 'NOT_LOGGED'
			routineId: string
			routineDayId: string
			routineName: string
			dayName: string
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
	| 'days'
>

type ActiveSession = Pick<
	WorkoutSession,
	'id' | 'status' | 'startedAt' | 'routineId' | 'routine' | 'routineDay'
>

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
	}
	planned
		.sort((a, b) =>
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
