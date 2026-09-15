import {
	addDays,
	buildScheduleWeek,
	localDateKey,
	type ScheduleDay,
	type ScheduleEntry,
	type ScheduleWeek,
	startOfWeek,
} from './schedule-week'

/**
 * PROG-05 / SCHED-02: a month of the same week rules, laid out as Monday-based
 * rows. Nothing new is decided here: each cell is the week builder's day, and
 * its single glyph is the strongest of its entries — what happened outranks
 * what was planned.
 */

export type ScheduleDayState =
	| 'COMPLETED'
	| 'IN_PROGRESS'
	| 'ABORTED'
	| 'NOT_LOGGED'
	| 'PLANNED'
	| 'REST'
	| 'EMPTY'

const PRECEDENCE: ScheduleDayState[] = [
	'COMPLETED',
	'IN_PROGRESS',
	'ABORTED',
	'NOT_LOGGED',
	'PLANNED',
	'REST',
]

const entryState = (entry: ScheduleEntry): ScheduleDayState =>
	entry.kind === 'SESSION' ? entry.status : entry.kind

export function scheduleDayState(day: Pick<ScheduleDay, 'entries'>) {
	const states = new Set(day.entries.map(entryState))
	return PRECEDENCE.find(state => states.has(state)) ?? 'EMPTY'
}

export interface ScheduleMonthCell extends ScheduleDay {
	inMonth: boolean
	/** EMPTY for days outside the month, which the totals leave out. */
	state: ScheduleDayState
}

export interface ScheduleMonth {
	/** YYYY-MM-01 */
	monthStart: string
	weeks: ScheduleMonthCell[][]
	includesToday: boolean
	totals: ScheduleWeek['totals']
	/** Days of the month, up to today, with a completed session. */
	trainedDays: number
	/** Days of the month up to and including today. */
	countedDays: number
}

type WeekInput = Parameters<typeof buildScheduleWeek>[0]

export const startOfMonth = (date: Date): Date =>
	new Date(date.getFullYear(), date.getMonth(), 1)

export const addMonths = (date: Date, months: number): Date =>
	new Date(date.getFullYear(), date.getMonth() + months, 1)

const DAY_MS = 86_400_000

function monthGrid(monthStart: Date) {
	const first = startOfWeek(monthStart)
	const last = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
	const span = Math.round((last.getTime() - first.getTime()) / DAY_MS) + 1
	return { first, weeks: Math.ceil(span / 7) }
}

/** The sessions read for the whole grid, one day past it (see the week range). */
export function scheduleMonthRange(monthStart: Date) {
	const { first, weeks } = monthGrid(monthStart)
	return {
		from: first.toISOString(),
		to: addDays(first, weeks * 7 + 1).toISOString(),
	}
}

export function buildScheduleMonth({
	monthStart,
	...input
}: Omit<WeekInput, 'weekStart'> & { monthStart: Date }): ScheduleMonth {
	const { first, weeks } = monthGrid(monthStart)
	const monthKey = localDateKey(monthStart).slice(0, 7)
	const today = localDateKey(input.now)
	const rows = Array.from({ length: weeks }, (_, index) =>
		buildScheduleWeek({
			...input,
			weekStart: addDays(first, index * 7),
		}).days.map((day): ScheduleMonthCell => {
			const inMonth = day.date.startsWith(monthKey)
			return {
				...day,
				inMonth,
				state: inMonth ? scheduleDayState(day) : 'EMPTY',
			}
		}),
	)
	const cells = rows.flat().filter(cell => cell.inMonth)
	const entries = cells.flatMap(cell => cell.entries)
	const count = (predicate: (entry: ScheduleEntry) => boolean) =>
		entries.filter(predicate).length
	const elapsed = cells.filter(cell => cell.date <= today)

	return {
		monthStart: localDateKey(monthStart),
		weeks: rows,
		includesToday: cells.some(cell => cell.isToday),
		totals: {
			completed: count(e => e.kind === 'SESSION' && e.status === 'COMPLETED'),
			aborted: count(e => e.kind === 'SESSION' && e.status === 'ABORTED'),
			planned: count(e => e.kind === 'PLANNED'),
			notLogged: count(e => e.kind === 'NOT_LOGGED'),
			rest: count(e => e.kind === 'REST'),
		},
		trainedDays: elapsed.filter(cell =>
			cell.entries.some(
				entry => entry.kind === 'SESSION' && entry.status === 'COMPLETED',
			),
		).length,
		countedDays: elapsed.length,
	}
}

const MONTH_FORMAT = new Intl.DateTimeFormat(undefined, {
	month: 'long',
	year: 'numeric',
})
const CELL_FORMAT = new Intl.DateTimeFormat(undefined, {
	weekday: 'long',
	day: 'numeric',
	month: 'long',
})

const fromKey = (key: string) => {
	const [year, month, day] = key.split('-').map(Number)
	return new Date(year, month - 1, day || 1)
}

export function describeMonth(monthStart: string, now: Date): string {
	const current = startOfMonth(now)
	if (monthStart === localDateKey(current)) return 'This month'
	if (monthStart === localDateKey(addMonths(current, -1))) return 'Last month'
	if (monthStart === localDateKey(addMonths(current, 1))) return 'Next month'
	return MONTH_FORMAT.format(fromKey(monthStart))
}

export const formatMonth = (monthStart: string) =>
	MONTH_FORMAT.format(fromKey(monthStart))

/** "Trained on 9 of 15 days so far"; null for a month that has not begun. */
export function describeConsistency(
	month: Pick<ScheduleMonth, 'trainedDays' | 'countedDays' | 'includesToday'>,
): string | null {
	if (month.countedDays === 0) return null
	const days = month.countedDays === 1 ? 'day' : 'days'
	return `Trained on ${month.trainedDays} of ${month.countedDays} ${days}${
		month.includesToday ? ' so far' : ''
	}`
}

const STATE_WORDS: Record<Exclude<ScheduleDayState, 'EMPTY'>, string> = {
	COMPLETED: 'completed',
	IN_PROGRESS: 'in progress',
	ABORTED: 'ended early',
	NOT_LOGGED: 'not logged',
	PLANNED: 'planned',
	REST: 'rest day',
}

/** A cell's accessible name: "Tuesday 15 September, today: 1 completed, 1 planned". */
export function describeMonthCell(
	cell: Pick<ScheduleMonthCell, 'date' | 'isToday' | 'entries'>,
): string {
	const counts = new Map<string, number>()
	for (const entry of cell.entries) {
		const word = STATE_WORDS[entryState(entry) as keyof typeof STATE_WORDS]
		counts.set(word, (counts.get(word) ?? 0) + 1)
	}
	const parts = PRECEDENCE.map(
		state => STATE_WORDS[state as keyof typeof STATE_WORDS],
	)
		.filter(word => counts.has(word))
		.map(word => `${counts.get(word)} ${word}`)
	const date = `${CELL_FORMAT.format(fromKey(cell.date))}${cell.isToday ? ', today' : ''}`
	return `${date}: ${parts.length ? parts.join(', ') : 'nothing planned'}`
}
