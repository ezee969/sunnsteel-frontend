import {
	DELOAD_MAX_DAYS,
	type DeloadSuggestion,
	type DeloadSuggestionEvidence,
	type DeloadSuggestionResponse,
	type DeloadSuggestionSignal,
	type TrainingSignalsResponse,
} from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import { intlLocale } from '@/i18n/date-locale'
import type { Translator } from '@/i18n/translator'

/**
 * INTEL-02 copy. The suggestion restates the evidence PROG-10 already shows
 * and names the deload it would open; it never names a cause and never tells
 * the member what they need. Nothing happens until the deload is saved.
 */

type T = Translator<'progress.deloadSuggestion'>

export const deloadSuggestionTitle = (t: T) => t('title')
export const deloadSuggestionAction = (t: T) => t('action')

const decimal = (value: number, locale: Locale) =>
	new Intl.NumberFormat(intlLocale(locale), {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	}).format(value)

function joinList(items: string[], t: T): string {
	if (items.length <= 1) return items.join('')
	return t('joinLast', {
		head: items.slice(0, -1).join(', '),
		last: items[items.length - 1],
	})
}

/** What each load signal shows today, with its number when it is loaded. */
function describeSignal(
	signal: DeloadSuggestionSignal,
	t: T,
	locale: Locale,
	signals?: TrainingSignalsResponse,
): string {
	if (signal === 'EFFORT') {
		const comparison = signals?.effort.comparison
		return comparison
			? t('signalEffortWith', {
					value: decimal(comparison.difference, locale),
				})
			: t('signalEffort')
	}
	if (signal === 'REP_TARGETS') {
		const targets = signals?.repTargets
		return targets
			? t('signalRepTargetsWith', {
					recent: targets.recent.shortPercent,
					previous: targets.previous.shortPercent,
				})
			: t('signalRepTargets')
	}
	const lifts = signals?.declines.lifts.length
	return lifts ? t('signalDeclinesWith', { count: lifts }) : t('signalDeclines')
}

/** "Marked today and a week ago: … Marked today: …" -- evidence, not a reason. */
export function describeSuggestionEvidence(
	evidence: readonly DeloadSuggestionEvidence[],
	t: T,
	locale: Locale,
	signals?: TrainingSignalsResponse,
): string {
	const both = evidence
		.filter(entry => entry.markedNow && entry.markedEarlier)
		.map(entry => describeSignal(entry.signal, t, locale, signals))
	const today = evidence
		.filter(entry => entry.markedNow && !entry.markedEarlier)
		.map(entry => describeSignal(entry.signal, t, locale, signals))
	const parts = []
	if (both.length) parts.push(t('markedBoth', { list: joinList(both, t) }))
	if (today.length) parts.push(t('markedToday', { list: joinList(today, t) }))
	const sentence = parts.join(' ')
	return (
		sentence.charAt(0).toLocaleUpperCase(intlLocale(locale)) + sentence.slice(1)
	)
}

const fromKey = (key: string) => {
	const [year, month, day] = key.split('-').map(Number)
	return new Date(year, month - 1, day)
}

export const formatSuggestionDate = (key: string, locale: Locale) =>
	new Intl.DateTimeFormat(intlLocale(locale), {
		month: 'short',
		day: 'numeric',
	}).format(fromKey(key))

export function describeSuggestionPlan(
	suggestion: DeloadSuggestion,
	t: T,
	locale: Locale,
): string {
	return t('plan', {
		routine: suggestion.routineName,
		block: suggestion.trainingBlockName
			? t('block', { name: suggestion.trainingBlockName })
			: '',
		start: formatSuggestionDate(suggestion.startDate, locale),
		end: formatSuggestionDate(suggestion.endDate, locale),
		days: t('days', { count: suggestion.lengthDays }),
		loads:
			suggestion.loadReductionPercent === 0
				? t('loadsUnchanged')
				: t('loadsLighter', { percent: suggestion.loadReductionPercent }),
		sets: suggestion.setMode === 'HALF' ? t('setsHalf') : t('setsEvery'),
	})
}

/** The routine page, with the Deloads dialog opening on these dates. */
export function deloadSuggestionHref(suggestion: DeloadSuggestion): string {
	const params = new URLSearchParams({
		deload: 'suggested',
		start: suggestion.startDate,
		days: String(suggestion.lengthDays),
	})
	return `/routines/${suggestion.routineId}?${params.toString()}`
}

/** Reads the dates a suggestion link carries; anything malformed is ignored. */
export function parseSuggestedDeload(
	params: Pick<URLSearchParams, 'get'> | null,
): { startDate: string; length: number } | null {
	if (params?.get('deload') !== 'suggested') return null
	const startDate = params.get('start') ?? ''
	const length = Number(params.get('days'))
	if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return null
	if (!Number.isInteger(length) || length < 1 || length > DELOAD_MAX_DAYS) {
		return null
	}
	return { startDate, length }
}

export function hasDeloadSuggestion(
	response?: DeloadSuggestionResponse,
): response is DeloadSuggestionResponse & { suggestion: DeloadSuggestion } {
	return Boolean(response?.suggestion)
}
