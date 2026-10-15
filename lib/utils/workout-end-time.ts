import { earliestWorkoutEnd, finishNeedsEndTime } from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import type { Translator } from '@/i18n/translator'

import { formatDuration } from './time-format.utils'

/**
 * LIVE-24: when a workout ended. Contracts hold the rule the server applies;
 * this module turns it into the field the owner edits -- a local date and
 * time to the minute -- and back.
 */

type Instant = string | Date

interface LoggedSet {
	isCompleted: boolean
	completedAt?: string | null
}

export interface FinishTimeline {
	/** The earliest the workout can end: its start or its last completed set. */
	earliest: Date
	/** The last thing saved: a set ticked, a set saved or the start. */
	lastActivity: Date
	/** Finish asks when the workout ended: the last activity is a pause old. */
	asks: boolean
}

/** Where a workout in progress stands, for Finish and for recovery. */
export function finishTimeline(
	input: {
		startedAt: Instant
		lastActivityAt?: Instant | null
		setLogs?: LoggedSet[]
	},
	now: Date = new Date(),
): FinishTimeline {
	const earliest = earliestWorkoutEnd({
		startedAt: input.startedAt,
		completedAts: (input.setLogs ?? [])
			.filter(log => log.isCompleted)
			.map(log => log.completedAt),
	})
	const saved = input.lastActivityAt
		? new Date(input.lastActivityAt).getTime()
		: Number.NaN
	const lastActivity = new Date(
		Number.isFinite(saved)
			? Math.min(Math.max(saved, earliest.getTime()), now.getTime())
			: earliest.getTime(),
	)
	return {
		earliest,
		lastActivity,
		asks: finishNeedsEndTime(lastActivity, now),
	}
}

const pad = (value: number) => String(value).padStart(2, '0')

/** A `datetime-local` value, on the device's clock, to the minute. */
export function toDateTimeLocal(date: Date): string {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
		date.getDate(),
	)}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** The instant a `datetime-local` value names, or null when it names none. */
export function fromDateTimeLocal(value: string): Date | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim())
	if (!match) return null
	const [, y, mo, d, h, mi] = match.map(Number)
	const date = new Date(y, mo - 1, d, h, mi)
	return date.getFullYear() === y &&
		date.getMonth() === mo - 1 &&
		date.getDate() === d
		? date
		: null
}

const MINUTE_MS = 60_000
const minuteOf = (date: Date) =>
	Math.floor(date.getTime() / MINUTE_MS) * MINUTE_MS

export type EndTimeProblem = 'invalid' | 'beforeEarliest' | 'afterLatest'

/**
 * The end a chosen minute stands for. The field holds minutes and the bounds
 * hold seconds, so the minute of the earliest end means the earliest end
 * itself; anything before that minute or after the latest one is a problem.
 */
export function chosenEnd(
	value: string,
	earliest: Date,
	latest: Date,
): { endedAt: Date } | { problem: EndTimeProblem } {
	const chosen = fromDateTimeLocal(value)
	if (!chosen) return { problem: 'invalid' }
	const at = chosen.getTime()
	if (at < minuteOf(earliest)) return { problem: 'beforeEarliest' }
	if (at > minuteOf(latest)) return { problem: 'afterLatest' }
	return {
		endedAt: new Date(
			Math.min(Math.max(at, earliest.getTime()), latest.getTime()),
		),
	}
}

/** A clock time, with the day when it is not on `reference`'s day. */
export function formatEndTime(
	value: Instant,
	locale: Locale,
	reference: Instant = new Date(),
): string {
	const date = new Date(value)
	const sameDay = new Date(reference).toDateString() === date.toDateString()
	return dateFormatter(
		locale,
		sameDay
			? { hour: '2-digit', minute: '2-digit' }
			: { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' },
	).format(date)
}

/** "Last set at 14:32 · 2h 27m": what the chosen end makes of the workout. */
export function describeEndTime(
	input: { startedAt: Instant; lastActivity: Date; value: string },
	locale: Locale,
	t: Translator<'workout.endTime'>,
): string {
	const lastSet = formatEndTime(input.lastActivity, locale)
	const end = fromDateTimeLocal(input.value)
	const seconds = end
		? Math.round((end.getTime() - new Date(input.startedAt).getTime()) / 1000)
		: null
	return seconds !== null && seconds > 0
		? t('hintWithDuration', { lastSet, duration: formatDuration(seconds) })
		: t('hint', { lastSet })
}

/** Why a chosen end cannot be used, in the member's words. */
export function describeEndTimeProblem(
	problem: EndTimeProblem,
	bounds: { earliest: Date; latest: Date; finishing: boolean },
	locale: Locale,
	t: Translator<'workout.endTime'>,
): string {
	if (problem === 'invalid') return t('problemInvalid')
	if (problem === 'beforeEarliest')
		return t('problemBeforeEarliest', {
			time: formatEndTime(bounds.earliest, locale),
		})
	return bounds.finishing
		? t('problemFuture')
		: t('problemOnlyEarlier', { time: formatEndTime(bounds.latest, locale) })
}
