import {
	type Routine,
	routineDayLabel,
	SCHEDULE_MOVE_MAX_DAYS,
	SCHEDULE_SKIP_PAST_DAYS,
	type ScheduleOverride,
	type WorkoutSession,
	type WorkoutSessionSummary,
} from '@sunsteel/contracts'

import { weekdayName } from './date'
import {
	isRotationRoutine,
	landingDay,
	nextRotationDay,
	orderedRoutineDays,
	routineOn,
	type RoutineOnDate,
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
 * ROUT-15 (2026-09-23): each date follows the plan in force on it -- a
 * training block's schedule and days while one covers the date, the baseline
 * otherwise -- so a week that crosses a block boundary is planned in
 * segments. A rotation block starts on its own first day and the baseline
 * rotation resumes where it left off.
 */

/**
 * ROUT-15: the block a planned entry comes from, when it is one. ROUT-16:
 * `deload` marks an entry of a deload, whose days are lighter.
 */
type BlockName = { trainingBlockName?: string; deload?: true }

export type ScheduleSessionStatus = 'COMPLETED' | 'ABORTED' | 'IN_PROGRESS'

export type ScheduleEntry = BlockName &
	(
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
				/** SCHED-04: a weekly occurrence's planned date, so it can be moved. */
				occurrenceDate?: string
				/** Set when the occurrence was moved here from `movedFrom`. */
				overrideId?: string
				movedFrom?: string
		  }
		| {
				kind: 'NOT_LOGGED'
				routineId: string
				/** Null on a rotation's past training weekday: its day is unknown. */
				routineDayId: string | null
				routineName: string
				dayName: string | null
				/** A weekly occurrence's planned date, so it can be marked skipped. */
				occurrenceDate?: string
				overrideId?: string
				movedFrom?: string
		  }
		| {
				/** SCHED-07: a weekday the routine rests on by plan. */
				kind: 'REST'
				routineId: string
				routineName: string
				dayName: null
		  }
		| {
				/** SCHED-04: the planned date of an occurrence moved to `toDate`. */
				kind: 'MOVED'
				routineId: string
				routineDayId: string
				routineName: string
				dayName: string
				overrideId: string
				toDate: string
		  }
		| {
				/** SCHED-05: an occurrence skipped on purpose, never "not logged". */
				kind: 'SKIPPED'
				routineId: string
				routineDayId: string
				routineName: string
				dayName: string
				overrideId: string
		  }
	)

export interface ScheduleDay {
	/** Local calendar date, YYYY-MM-DD. */
	date: string
	dayOfWeek: number
	isToday: boolean
	isPast: boolean
	entries: ScheduleEntry[]
}

export interface ScheduleRotationNote extends BlockName {
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
		moved: number
		skipped: number
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
	| 'trainingBlocks'
	| 'temporaryOverrides'
>

type PlannedRoutine = RoutineOnDate<ScheduleRoutine>

/**
 * ROUT-15: when the plan in force on `date` began: its block's start, else
 * the day after the latest block that ended before it, else never (empty).
 */
function planStart(
	baseline: ScheduleRoutine,
	routine: PlannedRoutine,
	date: string,
): string {
	if (routine.trainingBlock) return routine.trainingBlock.startDate
	const ended = (baseline.trainingBlocks ?? [])
		.map(block => block.endDate)
		.filter(endDate => endDate < date)
		.sort()
		.at(-1)
	return ended ? localDateKey(addDays(fromKey(ended), 1)) : ''
}

const blockNameOf = (routine: PlannedRoutine): BlockName => ({
	...(routine.trainingBlock
		? { trainingBlockName: routine.trainingBlock.name }
		: {}),
	...(routine.temporaryOverride ? { deload: true as const } : {}),
})

type ActiveSession = Pick<
	WorkoutSession,
	'id' | 'status' | 'startedAt' | 'routineId' | 'routine' | 'routineDay'
> &
	Partial<Pick<WorkoutSession, 'trainingBlock' | 'temporaryOverride'>> &
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
		from,
		label,
	}: {
		days: readonly ScheduleDay[]
		now: Date
		trained: ReadonlySet<string>
		trainedToday: boolean
		activeDayId: string | null
		/**
		 * ROUT-15: the date this plan came into force -- a block's start, or the
		 * day after the block before it ended -- or empty for a baseline that
		 * has always been in force. Rotation slots count from there.
		 */
		from: string
		label: BlockName
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
	// ROUT-15: a plan that begins later in the week counts its days from its
	// own start, so a block's first training day is its first day.
	if (from && localDateKey(first) < from) first = fromKey(from)
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
					...label,
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
				...label,
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
	overrides,
}: {
	weekStart: Date
	now: Date
	routines: readonly ScheduleRoutine[]
	sessions: readonly WorkoutSessionSummary[]
	active?: ActiveSession | null
	/** SCHED-04: per-date overrides whose date or target falls in the week. */
	overrides?: readonly ScheduleOverride[]
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
			...(session.routine.trainingBlockName
				? { trainingBlockName: session.routine.trainingBlockName }
				: {}),
			...(session.routine.temporaryOverrideKind
				? { deload: true as const }
				: {}),
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
			...(active.trainingBlock
				? { trainingBlockName: active.trainingBlock.name }
				: {}),
			...(active.temporaryOverride ? { deload: true as const } : {}),
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
	for (const baseline of routines) {
		if (baseline.isCompleted) continue
		const createdOn = localDateKey(new Date(baseline.createdAt))
		// ROUT-15: the undated rotation note follows the plan in force from
		// today, or from the week's start for a week still to come.
		const noteRoutine = routineOn(
			baseline,
			days[0].date > today ? days[0].date : today,
		)
		if (
			isRotationRoutine(noteRoutine) &&
			!noteRoutine.rotationWeekdays?.length
		) {
			const next = nextRotationDay(noteRoutine)
			if (next) {
				rotations.push({
					routineId: baseline.id,
					routineName: baseline.name,
					nextDayId: next.id,
					nextDayName: routineDayLabel(next),
					...blockNameOf(noteRoutine),
				})
			}
		}

		// SCHED-04: this routine's moves, by planned date and by target.
		const moves = (overrides ?? []).filter(
			move =>
				move.routineId === baseline.id && move.kind === 'MOVE' && move.toDate,
		)
		const movedAway = new Map(moves.map(move => [move.date, move]))
		// SCHED-05: skipped occurrences, by planned date.
		const skips = new Map(
			(overrides ?? [])
				.filter(skip => skip.routineId === baseline.id && skip.kind === 'SKIP')
				.map(skip => [skip.date, skip]),
		)
		const occurrence = (
			routine: PlannedRoutine,
			day: ScheduleDay,
			routineDay: Routine['days'][number],
			move?: ScheduleOverride,
		): ScheduleEntry => {
			const base = {
				routineId: routine.id,
				routineDayId: routineDay.id,
				routineName: routine.name,
				dayName: routineDayLabel(routineDay),
				...blockNameOf(routine),
				...(move ? { overrideId: move.id, movedFrom: move.date } : {}),
			}
			return day.isPast
				? {
						kind: 'NOT_LOGGED',
						...base,
						occurrenceDate: move?.date ?? day.date,
					}
				: { kind: 'PLANNED', ...base, occurrenceDate: move?.date ?? day.date }
		}

		// A moved occurrence sits on its target unless a session of the routine
		// happened on either date. Its day is the one on the planned weekday of
		// the plan in force on the planned date, so an edit -- or a training
		// block -- without that weekday drops the move.
		const movedIn = new Set<string>()
		for (const move of moves) {
			const target = byDate.get(move.toDate as string)
			if (!target || move.date < createdOn) continue
			const plannedOn = routineOn(baseline, move.date)
			if (isRotationRoutine(plannedOn)) continue
			const weekday = fromKey(move.date).getDay()
			const plannedDay = plannedOn.days.find(d => d.dayOfWeek === weekday)
			if (!plannedDay) continue
			// ROUT-16: moved into or out of a deload, it trains that date's
			// version of the day, the one the server starts there.
			const { routine, day: routineDay } = landingDay(
				plannedOn,
				routineOn(baseline, target.date),
				plannedDay,
			)
			if (
				trained.has(`${baseline.id}|${target.date}`) ||
				trained.has(`${baseline.id}|${move.date}`)
			) {
				continue
			}
			movedIn.add(target.date)
			planned.push({
				date: target.date,
				entry: occurrence(routine, target, routineDay, move),
			})
		}

		// ROUT-15: consecutive dates under the same plan form one segment;
		// ROUT-16: a deload starts and ends one inside its plan.
		const planKey = (routine: PlannedRoutine) =>
			`${routine.trainingBlock?.id ?? ''}|${routine.temporaryOverride?.id ?? ''}`
		const segments: Array<{ routine: PlannedRoutine; days: ScheduleDay[] }> = []
		for (const day of days) {
			const routine = routineOn(baseline, day.date)
			const last = segments.at(-1)
			if (last && planKey(last.routine) === planKey(routine)) {
				last.days.push(day)
			} else {
				segments.push({ routine, days: [day] })
			}
		}

		for (const { routine, days: segmentDays } of segments) {
			if (isRotationRoutine(routine)) {
				if (!routine.rotationWeekdays?.length) continue
				planned.push(
					...planRotation(routine, {
						days: segmentDays,
						now,
						trained,
						trainedToday: trainedToday.has(routine.id),
						activeDayId:
							active?.status === 'IN_PROGRESS' &&
							active.routineId === routine.id
								? (active.routineDayId ?? null)
								: null,
						// ROUT-16: a deload continues its plan's rotation, so it
						// counts from the plan's start, not its own.
						from: planStart(baseline, routine, segmentDays[0].date),
						label: blockNameOf(routine),
					}),
				)
				continue
			}
			for (const routineDay of routine.days) {
				if (routineDay.dayOfWeek === null) continue
				const day = segmentDays.find(d => d.dayOfWeek === routineDay.dayOfWeek)
				if (!day || day.date < createdOn) continue
				if (trained.has(`${routine.id}|${day.date}`)) continue
				// A session on the date still counts; the skip only replaces the plan.
				const skip = skips.get(day.date)
				if (skip) {
					planned.push({
						date: day.date,
						entry: {
							kind: 'SKIPPED',
							routineId: routine.id,
							routineDayId: routineDay.id,
							routineName: routine.name,
							dayName: routineDayLabel(routineDay),
							overrideId: skip.id,
							...blockNameOf(routine),
						},
					})
					continue
				}
				const move = movedAway.get(day.date)
				planned.push({
					date: day.date,
					entry: move?.toDate
						? {
								kind: 'MOVED',
								routineId: routine.id,
								routineDayId: routineDay.id,
								routineName: routine.name,
								dayName: routineDayLabel(routineDay),
								overrideId: move.id,
								toDate: move.toDate,
								...blockNameOf(routine),
							}
						: occurrence(routine, day, routineDay),
				})
			}
			// SCHED-07: planned rest is never "not logged"; a session replaces it,
			// and so does a workout moved onto it (SCHED-04).
			for (const weekday of routine.restDays ?? []) {
				const day = segmentDays.find(d => d.dayOfWeek === weekday)
				if (!day || day.date < createdOn) continue
				if (trained.has(`${routine.id}|${day.date}`)) continue
				if (movedIn.has(day.date)) continue
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
			moved: count(e => e.kind === 'MOVED'),
			skipped: count(e => e.kind === 'SKIPPED'),
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
		totals.moved ? `${totals.moved} moved` : null,
		totals.skipped ? `${totals.skipped} skipped` : null,
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

/** "Thu 17 Sep" */
export const describeShortDate = (key: string) =>
	`${weekdayName(fromKey(key).getDay(), 'short')} ${DAY_FORMAT.format(fromKey(key))}`

export type ScheduleMoveAction =
	| {
			kind: 'MOVE'
			routineId: string
			/** The occurrence's planned date, which identifies it. */
			occurrenceDate: string
			/** Where it falls now: its planned date, or its target once moved. */
			currentDate: string
			overrideId: string | null
	  }
	| { kind: 'UNDO'; overrideId: string }
	/** SCHED-05: a passed day without a session, marked skipped after all. */
	| { kind: 'SKIP'; routineId: string; occurrenceDate: string }
	| null

/**
 * SCHED-04: whether an entry can be moved or its move undone. A weekly
 * occurrence moves while neither its planned date nor where it sits now has
 * passed; a moved one whose planned date passed can still be put back.
 */
export function scheduleMoveAction(
	entry: ScheduleEntry,
	day: Pick<ScheduleDay, 'date' | 'isPast'>,
	now: Date,
): ScheduleMoveAction {
	if (entry.kind === 'MOVED' || entry.kind === 'SKIPPED') {
		return { kind: 'UNDO', overrideId: entry.overrideId }
	}
	// SCHED-05: a passed weekly day without a session can still be explained
	// as skipped, up to SCHEDULE_SKIP_PAST_DAYS back.
	if (entry.kind === 'NOT_LOGGED') {
		return entry.occurrenceDate &&
			entry.occurrenceDate >=
				localDateKey(addDays(now, -SCHEDULE_SKIP_PAST_DAYS))
			? {
					kind: 'SKIP',
					routineId: entry.routineId,
					occurrenceDate: entry.occurrenceDate,
				}
			: null
	}
	if (entry.kind !== 'PLANNED' || !entry.occurrenceDate || day.isPast) {
		return null
	}
	if (entry.occurrenceDate < localDateKey(now)) {
		return entry.overrideId
			? { kind: 'UNDO', overrideId: entry.overrideId }
			: null
	}
	return {
		kind: 'MOVE',
		routineId: entry.routineId,
		occurrenceDate: entry.occurrenceDate,
		currentDate: day.date,
		overrideId: entry.overrideId ?? null,
	}
}

/**
 * SCHED-04: the dates an occurrence can move to — up to
 * SCHEDULE_MOVE_MAX_DAYS before or after its planned date, from today on,
 * never onto a date the routine is planned on (unless that occurrence moved
 * away) nor one another of its occurrences moved to. The server checks the
 * same rules.
 */
export function moveTargets({
	occurrenceDate,
	now,
	routine,
	overrides,
}: {
	occurrenceDate: string
	now: Date
	routine: Pick<
		Routine,
		| 'id'
		| 'days'
		| 'scheduleMode'
		| 'restDays'
		| 'rotationWeekdays'
		| 'nextRotationDayId'
		| 'trainingBlocks'
		| 'temporaryOverrides'
	>
	overrides: readonly ScheduleOverride[]
}): string[] {
	const today = localDateKey(now)
	// ROUT-15: a date is judged by the plan in force on it.
	const trainsOn = (date: string) =>
		routineOn(routine, date).days.some(
			day => day.dayOfWeek === fromKey(date).getDay(),
		)
	const others = overrides.filter(
		move => move.routineId === routine.id && move.date !== occurrenceDate,
	)
	const origin = fromKey(occurrenceDate)
	const targets: string[] = []
	for (
		let offset = -SCHEDULE_MOVE_MAX_DAYS;
		offset <= SCHEDULE_MOVE_MAX_DAYS;
		offset += 1
	) {
		if (offset === 0) continue
		const date = localDateKey(addDays(origin, offset))
		if (date < today) continue
		const plannedThere =
			trainsOn(date) &&
			// A date whose own workout moved away or was skipped (SCHED-05) is free.
			!others.some(
				move => move.date === date && (move.toDate || move.kind === 'SKIP'),
			)
		if (plannedThere) continue
		if (others.some(move => move.toDate === date)) continue
		targets.push(date)
	}
	return targets
}

/**
 * SCHED-05: postponing is a move to the first free day after where the
 * workout sits now, from the targets `moveTargets` allows.
 */
export const postponeTarget = (
	targets: readonly string[],
	currentDate: string,
): string | null => targets.find(date => date > currentDate) ?? null

export const describeScheduleDay = (day: ScheduleDay) => ({
	weekday: weekdayName(day.dayOfWeek, 'long'),
	date: DAY_FORMAT.format(fromKey(day.date)),
})
