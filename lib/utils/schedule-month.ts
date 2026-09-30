import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import type { MessageKey, Translator } from '@/i18n/translator'

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
	| 'MOVED'
	| 'SKIPPED'
	| 'EMPTY'

const PRECEDENCE: ScheduleDayState[] = [
	'COMPLETED',
	'IN_PROGRESS',
	'ABORTED',
	'NOT_LOGGED',
	'PLANNED',
	'SKIPPED',
	'REST',
	'MOVED',
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
			moved: count(e => e.kind === 'MOVED'),
			skipped: count(e => e.kind === 'SKIPPED'),
		},
		trainedDays: elapsed.filter(cell =>
			cell.entries.some(
				entry => entry.kind === 'SESSION' && entry.status === 'COMPLETED',
			),
		).length,
		countedDays: elapsed.length,
	}
}

const MONTH_FORMAT = (locale: Locale) =>
	dateFormatter(locale, { month: 'long', year: 'numeric' })
const CELL_FORMAT = (locale: Locale) =>
	dateFormatter(locale, { weekday: 'long', day: 'numeric', month: 'long' })

const fromKey = (key: string) => {
	const [year, month, day] = key.split('-').map(Number)
	return new Date(year, month - 1, day || 1)
}

type ScheduleMonthTranslator = Translator<'planning.scheduleMonth'>

export function describeMonth(
	monthStart: string,
	now: Date,
	locale: Locale,
	t: ScheduleMonthTranslator,
): string {
	const current = startOfMonth(now)
	if (monthStart === localDateKey(current)) return t('thisMonth')
	if (monthStart === localDateKey(addMonths(current, -1))) return t('lastMonth')
	if (monthStart === localDateKey(addMonths(current, 1))) return t('nextMonth')
	return MONTH_FORMAT(locale).format(fromKey(monthStart))
}

export const formatMonth = (monthStart: string, locale: Locale) =>
	MONTH_FORMAT(locale).format(fromKey(monthStart))

/** "Trained on 9 of 15 days so far"; null for a month that has not begun. */
export function describeConsistency(
	month: Pick<ScheduleMonth, 'trainedDays' | 'countedDays' | 'includesToday'>,
	t: ScheduleMonthTranslator,
): string | null {
	if (month.countedDays === 0) return null
	return t(month.includesToday ? 'consistencySoFar' : 'consistency', {
		trained: month.trainedDays,
		counted: month.countedDays,
	})
}

type CountedState = Exclude<ScheduleDayState, 'EMPTY'>

const CELL_KEYS: Record<CountedState, MessageKey<'planning.scheduleMonth'>> = {
	COMPLETED: 'cell.COMPLETED',
	IN_PROGRESS: 'cell.IN_PROGRESS',
	ABORTED: 'cell.ABORTED',
	NOT_LOGGED: 'cell.NOT_LOGGED',
	PLANNED: 'cell.PLANNED',
	REST: 'cell.REST',
	MOVED: 'cell.MOVED',
	SKIPPED: 'cell.SKIPPED',
}

const STATUS_KEYS: Record<
	CountedState,
	MessageKey<'planning.scheduleMonth'>
> = {
	COMPLETED: 'status.COMPLETED',
	IN_PROGRESS: 'status.IN_PROGRESS',
	ABORTED: 'status.ABORTED',
	NOT_LOGGED: 'status.NOT_LOGGED',
	PLANNED: 'status.PLANNED',
	REST: 'status.REST',
	MOVED: 'status.MOVED',
	SKIPPED: 'status.SKIPPED',
}

const TOTAL_KEYS: Record<
	keyof ScheduleWeek['totals'],
	MessageKey<'planning.scheduleMonth'>
> = {
	completed: 'total.COMPLETED',
	aborted: 'total.ABORTED',
	planned: 'total.PLANNED',
	notLogged: 'total.NOT_LOGGED',
	rest: 'total.REST',
	moved: 'total.MOVED',
	skipped: 'total.SKIPPED',
}

/** A state's name as the legend prints it: "Not logged". */
export function scheduleStatusLabel(
	state: CountedState,
	t: ScheduleMonthTranslator,
): string {
	const key: MessageKey<'planning.scheduleMonth'> = STATUS_KEYS[state]
	return t(key)
}

/** The month's totals in one line: "3 completed · 1 planned". */
export function describeMonthTotals(
	totals: ScheduleWeek['totals'],
	t: ScheduleMonthTranslator,
): string {
	const parts = (Object.keys(TOTAL_KEYS) as (keyof typeof TOTAL_KEYS)[])
		.filter(name => totals[name])
		.map(name => {
			const key: MessageKey<'planning.scheduleMonth'> = TOTAL_KEYS[name]
			return t(key, { count: totals[name] })
		})
	return parts.length ? parts.join(' · ') : t('totalsEmpty')
}

/** A cell's accessible name: "Tuesday 15 September, today: 1 completed, 1 planned". */
export function describeMonthCell(
	cell: Pick<ScheduleMonthCell, 'date' | 'isToday' | 'entries'>,
	locale: Locale,
	t: ScheduleMonthTranslator,
): string {
	const counts = new Map<ScheduleDayState, number>()
	for (const entry of cell.entries) {
		const state = entryState(entry)
		counts.set(state, (counts.get(state) ?? 0) + 1)
	}
	const parts = PRECEDENCE.filter(state => counts.has(state)).map(state => {
		const key: MessageKey<'planning.scheduleMonth'> =
			CELL_KEYS[state as CountedState]
		return t(key, { count: counts.get(state) ?? 0 })
	})
	return t(cell.isToday ? 'cellLabelToday' : 'cellLabel', {
		date: CELL_FORMAT(locale).format(fromKey(cell.date)),
		parts: parts.length ? parts.join(', ') : t('nothingPlanned'),
	})
}
