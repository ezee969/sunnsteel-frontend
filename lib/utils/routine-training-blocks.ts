import type {
	RoutineTrainingBlockSource,
	RoutineTrainingBlockState,
} from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import type { Translator } from '@/i18n/translator'

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
	timeZone: 'UTC',
}

function parseCalendarDate(date: string) {
	return new Date(`${date}T12:00:00Z`)
}

export function formatTrainingBlockRange(
	startDate: string,
	endDate: string,
	locale: Locale,
) {
	const format = dateFormatter(locale, DATE_FORMAT_OPTIONS)
	return `${format.format(parseCalendarDate(startDate))} – ${format.format(parseCalendarDate(endDate))}`
}

export function trainingBlockStateLabel(
	state: RoutineTrainingBlockState,
	t: Translator<'routines.trainingBlocks'>,
) {
	return {
		FUTURE: t('upcoming'),
		ACTIVE: t('inProgress'),
		COMPLETE: t('complete'),
	}[state]
}

export function describeTrainingBlockSource(
	source: RoutineTrainingBlockSource,
	t: Translator<'routines.trainingBlocks'>,
) {
	if (source.kind === 'CURRENT_ROUTINE') return t('sourceCurrentRoutine')
	const title =
		source.versionName?.trim() ||
		t('sourceVersionNumber', { number: source.versionNumber ?? 0 })
	return t('sourceVersion', { title })
}

export function trainingBlockChangeNote(
	state: RoutineTrainingBlockState,
	t: Translator<'routines.trainingBlocks'>,
) {
	if (state === 'COMPLETE') return t('changeNoteComplete')
	if (state === 'ACTIVE') return t('changeNoteActive')
	return t('changeNoteFuture')
}

/**
 * ROUT-15: the line a routine page shows while a block is in force, naming
 * what the days below are and when the routine's own days return.
 */
export function describeBlockInForce(
	block: {
		name: string
		endDate: string
	},
	locale: Locale,
	t: Translator<'routines.trainingBlocks'>,
): string {
	const [year, month, day] = block.endDate.split('-').map(Number)
	const resume = new Date(Date.UTC(year, month - 1, day + 1, 12))
	const format = dateFormatter(locale, DATE_FORMAT_OPTIONS)
	return t('inForce', {
		name: block.name,
		endDate: format.format(parseCalendarDate(block.endDate)),
		resumeDate: format.format(resume),
	})
}
