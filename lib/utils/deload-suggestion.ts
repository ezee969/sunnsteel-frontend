import {
	DELOAD_MAX_DAYS,
	type DeloadSuggestion,
	type DeloadSuggestionEvidence,
	type DeloadSuggestionResponse,
	type DeloadSuggestionSignal,
	type TrainingSignalsResponse,
} from '@sunsteel/contracts'

/**
 * INTEL-02 copy. The suggestion restates the evidence PROG-10 already shows
 * and names the deload it would open; it never names a cause and never tells
 * the member what they need. Nothing happens until the deload is saved.
 */

export const DELOAD_SUGGESTION_TITLE = 'Suggestion: a lighter week'
export const DELOAD_SUGGESTION_ACTION = 'Plan this deload'

const decimal = (value: number) =>
	new Intl.NumberFormat(undefined, {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	}).format(value)

function joinList(items: string[]): string {
	if (items.length <= 1) return items.join('')
	return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/** What each load signal shows today, with its number when it is loaded. */
function describeSignal(
	signal: DeloadSuggestionSignal,
	signals?: TrainingSignalsResponse,
): string {
	if (signal === 'EFFORT') {
		const comparison = signals?.effort.comparison
		return comparison
			? `effort (average RPE up ${decimal(comparison.difference)})`
			: 'effort'
	}
	if (signal === 'REP_TARGETS') {
		const targets = signals?.repTargets
		return targets
			? `rep targets (${targets.recent.shortPercent}% of sets short, against ${targets.previous.shortPercent}% before)`
			: 'rep targets'
	}
	const lifts = signals?.declines.lifts.length
	return lifts
		? `declining lifts (${lifts} ${lifts === 1 ? 'lift' : 'lifts'})`
		: 'declining lifts'
}

/** "Marked today and a week ago: … Marked today: …" -- evidence, not a reason. */
export function describeSuggestionEvidence(
	evidence: readonly DeloadSuggestionEvidence[],
	signals?: TrainingSignalsResponse,
): string {
	const both = evidence
		.filter(entry => entry.markedNow && entry.markedEarlier)
		.map(entry => describeSignal(entry.signal, signals))
	const today = evidence
		.filter(entry => entry.markedNow && !entry.markedEarlier)
		.map(entry => describeSignal(entry.signal, signals))
	const parts = []
	if (both.length) parts.push(`Marked today and a week ago: ${joinList(both)}.`)
	if (today.length) parts.push(`Marked today: ${joinList(today)}.`)
	const sentence = parts.join(' ')
	return sentence.charAt(0).toUpperCase() + sentence.slice(1)
}

const fromKey = (key: string) => {
	const [year, month, day] = key.split('-').map(Number)
	return new Date(year, month - 1, day)
}

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
	month: 'short',
	day: 'numeric',
})

export const formatSuggestionDate = (key: string) =>
	DATE_FORMAT.format(fromKey(key))

export function describeSuggestionPlan(suggestion: DeloadSuggestion): string {
	const loads =
		suggestion.loadReductionPercent === 0
			? 'loads unchanged'
			: `loads ${suggestion.loadReductionPercent}% lighter`
	const sets = suggestion.setMode === 'HALF' ? 'half the sets' : 'every set'
	const block = suggestion.trainingBlockName
		? ` (${suggestion.trainingBlockName})`
		: ''
	const days = `${suggestion.lengthDays} ${suggestion.lengthDays === 1 ? 'day' : 'days'}`
	return (
		`Sunnsteel can plan a deload for ${suggestion.routineName}${block} from ` +
		`${formatSuggestionDate(suggestion.startDate)} to ${formatSuggestionDate(suggestion.endDate)} ` +
		`(${days}), with ${loads} and ${sets}. You can change it before saving; ` +
		'nothing changes unless you save it.'
	)
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
