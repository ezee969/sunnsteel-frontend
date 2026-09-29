import {
	type CalendarDate,
	DELOAD_DEFAULT_DAYS,
	DELOAD_MAX_DAYS,
	type DeloadOptions,
	type RoutineTemporaryOverride,
	type TemporaryOverrideSource,
} from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import type { Translator } from '@/i18n/translator'

import { formatTrainingBlockRange } from './routine-training-blocks'

/**
 * ROUT-16: the copy and date rules of a temporary deload. A deload is a
 * lighter copy of the prescription in force on its dates -- a training block's
 * or the routine's -- that replaces it for at most two weeks and pauses
 * progression. The server decides everything; these only word it and mirror
 * its checks so the dialog can say why it would refuse.
 */

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
	timeZone: 'UTC',
}

const parse = (date: CalendarDate) => {
	const [year, month, day] = date.split('-').map(Number)
	return Date.UTC(year, month - 1, day, 12)
}

const format = (date: CalendarDate, locale: Locale) =>
	dateFormatter(locale, DATE_FORMAT_OPTIONS).format(parse(date))

export function addCalendarDays(date: CalendarDate, days: number): string {
	return new Date(parse(date) + days * 86_400_000).toISOString().slice(0, 10)
}

/** The last day of a deload of `lengthDays` days, both ends included. */
export function deloadEndDate(startDate: CalendarDate, lengthDays: number) {
	return addCalendarDays(startDate, lengthDays - 1)
}

/** Lengths the dialog offers, 1 to the maximum. */
export const DELOAD_LENGTHS = Array.from(
	{ length: DELOAD_MAX_DAYS },
	(_, index) => index + 1,
)

export { DELOAD_DEFAULT_DAYS }

export function describeDeloadLength(
	days: number,
	t: Translator<'routines.deloads'>,
): string {
	if (days === 7) return t('weekLength')
	if (days === 14) return t('twoWeeksLength')
	return t('daysLength', { count: days })
}

/** "10% lighter · first half of the sets" */
export function describeDeloadOptions(
	{ loadReductionPercent, setMode }: DeloadOptions,
	t: Translator<'routines.deloads'>,
): string {
	const load =
		loadReductionPercent === 0
			? t('sameLoads')
			: t('percentLighter', { percent: loadReductionPercent })
	const sets = setMode === 'HALF' ? t('halfSets') : t('everySet')
	return `${load} · ${sets}`
}

export function deloadStateLabel(
	state: RoutineTemporaryOverride['state'],
	t: Translator<'routines.deloads'>,
) {
	return {
		FUTURE: t('stateUpcoming'),
		ACTIVE: t('stateInProgress'),
		COMPLETE: t('stateComplete'),
	}[state]
}

export function describeDeloadSource(
	source: TemporaryOverrideSource,
	t: Translator<'routines.deloads'>,
): string {
	return source.kind === 'TRAINING_BLOCK' && source.trainingBlockName
		? t('sourceLightensBlock', { name: source.trainingBlockName })
		: t('sourceLightensRoutine')
}

/**
 * Its dates. Ending a deload early moves its end to the day before, so one
 * ended on its first day ends before it starts and is named by that day.
 */
export function describeDeloadRange(
	deload: Pick<RoutineTemporaryOverride, 'startDate' | 'endDate'>,
	locale: Locale,
	t: Translator<'routines.deloads'>,
): string {
	return deload.endDate < deload.startDate
		? t('rangeEndedFirstDay', { date: format(deload.startDate, locale) })
		: formatTrainingBlockRange(deload.startDate, deload.endDate, locale)
}

/**
 * The line a routine page shows while a deload is in force: what the days
 * below are, that progression waits, and when the plan it lightens returns.
 */
export function describeDeloadInForce(
	deload: { endDate: CalendarDate },
	blockName: string | null,
	locale: Locale,
	t: Translator<'routines.deloads'>,
): string {
	return t('inForce', {
		hasBlock: blockName ? 'true' : 'false',
		blockName: blockName ?? '',
		endDate: format(deload.endDate, locale),
		resumeDate: format(addCalendarDays(deload.endDate, 1), locale),
	})
}

/**
 * The short label naming the plan a date or a workout trains, or null for the
 * routine itself: "Training block · Strength", "Deload", or both.
 */
export function planLabel(
	{
		trainingBlockName,
		deload,
	}: {
		trainingBlockName?: string | null
		deload?: boolean
	},
	t: Translator<'routines.deloads'>,
): string | null {
	const parts = [
		...(trainingBlockName
			? [t('planLabelTrainingBlock', { name: trainingBlockName })]
			: []),
		...(deload ? [t('planLabelDeload')] : []),
	]
	return parts.length ? parts.join(' · ') : null
}

/**
 * The first date from today no deload holds, so the dialog never opens on a
 * start the server would refuse as an overlap.
 */
export function firstFreeDate(
	today: CalendarDate,
	deloads: readonly { startDate: string; endDate: string }[],
): string {
	let date = today
	for (;;) {
		const holder = deloads.find(
			deload => deload.startDate <= date && date <= deload.endDate,
		)
		if (!holder) return date
		date = addCalendarDays(holder.endDate, 1)
	}
}

export type DeloadDateProblem =
	'PAST' | 'OVERLAPS_DELOAD' | 'CROSSES_BLOCK' | null

/**
 * The server's date rules (`assertDeloadDates`), so the dialog can explain a
 * refusal before sending: it starts today or later, never overlaps another
 * deload of the routine and stays inside one plan -- every date under the
 * same training block, or under none.
 */
export function deloadDateProblem({
	startDate,
	endDate,
	today,
	deloads,
	blocks,
}: {
	startDate: CalendarDate
	endDate: CalendarDate
	today: CalendarDate
	deloads: readonly { startDate: string; endDate: string }[]
	blocks: readonly { id: string; startDate: string; endDate: string }[]
}): DeloadDateProblem {
	if (startDate < today) return 'PAST'
	if (
		deloads.some(
			other =>
				other.endDate >= other.startDate &&
				startDate <= other.endDate &&
				endDate >= other.startDate,
		)
	) {
		return 'OVERLAPS_DELOAD'
	}
	const blockOn = (date: string) =>
		blocks.find(block => block.startDate <= date && date <= block.endDate)
			?.id ?? null
	const first = blockOn(startDate)
	for (let date = startDate; date <= endDate; date = addCalendarDays(date, 1)) {
		if (blockOn(date) !== first) return 'CROSSES_BLOCK'
	}
	return null
}

export function deloadDateProblemMessage(
	problem: Exclude<DeloadDateProblem, null>,
	t: Translator<'routines.deloads'>,
): string {
	return {
		PAST: t('problemPast'),
		OVERLAPS_DELOAD: t('problemOverlapsDeload'),
		CROSSES_BLOCK: t('problemCrossesBlock'),
	}[problem]
}
