import {
	BODY_MEASUREMENT_FIELDS,
	type BodyFieldSummary,
	type BodyMeasurement,
	type BodyMeasurementField,
	bodyMeasurementProblems,
	type BodyProgressRange,
	type MeasurableGoal,
	type UpsertBodyMeasurementRequest,
	type WeightUnit,
} from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import { intlLocale } from '@/i18n/date-locale'
import type { MessageKey, Translator } from '@/i18n/translator'

import {
	formatWeightInput,
	getWeightUnitLabel,
	kilogramsToDisplayWeight,
	parseWeightInput,
} from './weight-unit'

export const BODY_PROGRESS_RANGE_OPTIONS: ReadonlyArray<{
	value: BodyProgressRange
	label: string
}> = [
	{ value: '30D', label: '30D' },
	{ value: '90D', label: '90D' },
	{ value: '1Y', label: '1Y' },
	{ value: 'ALL', label: 'All' },
]

/** The measurements beside weight, in the order the contracts list them. */
export const BODY_LENGTH_FIELDS = BODY_MEASUREMENT_FIELDS.filter(
	field => field.key !== 'weightKg',
)

/**
 * PROG-12: contracts names the fields in English, so the label a member reads
 * is looked up from the stable key instead (rule 9 of docs/reference/i18n.md).
 */
const FIELD_KEYS = {
	weightKg: 'fieldWeightKg',
	waistCm: 'fieldWaistCm',
	hipsCm: 'fieldHipsCm',
	chestCm: 'fieldChestCm',
	armCm: 'fieldArmCm',
	thighCm: 'fieldThighCm',
	bodyFatPercent: 'fieldBodyFatPercent',
} as const satisfies Record<BodyMeasurementField, MessageKey<'progress.body'>>

export function bodyFieldLabel(
	field: BodyMeasurementField,
	t: Translator<'progress.body'>,
): string {
	return t(FIELD_KEYS[field])
}

// `undefined` matches `formatWeightAmount`: every number in the app follows
// the device's format today. Hard-coding 'en-US' here made body values the
// one exception.
const oneDecimal = (value: number) =>
	new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value)

/** Weight in the account's unit, lengths in cm and body fat in %. */
export function formatBodyValue(
	field: BodyMeasurementField,
	value: number,
	unit: WeightUnit,
): string {
	if (field === 'weightKg') {
		return `${oneDecimal(kilogramsToDisplayWeight(value, unit))} ${getWeightUnitLabel(unit)}`
	}
	if (field === 'bodyFatPercent') return `${oneDecimal(value)}%`
	return `${oneDecimal(value)} cm`
}

/** A signed change; a change that rounds to nothing says so. */
export function formatBodyChange(
	field: BodyMeasurementField,
	change: number,
	unit: WeightUnit,
	t: Translator<'progress.body'>,
): string {
	const shown =
		field === 'weightKg' ? kilogramsToDisplayWeight(change, unit) : change
	if (Math.abs(shown) < 0.05) return t('noChange')
	const sign = shown > 0 ? '+' : '-'
	return `${sign}${formatBodyValue(field, Math.abs(change), unit)}`
}

export function formatBodyDate(date: string, locale: Locale): string {
	return new Intl.DateTimeFormat(intlLocale(locale), {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC',
	}).format(new Date(`${date}T12:00:00Z`))
}

/** "−1.5 kg since Sep 1, 2026", or null when the range holds no change. */
export function describeBodyChange(
	summary: BodyFieldSummary,
	unit: WeightUnit,
	t: Translator<'progress.body'>,
	locale: Locale,
): string | null {
	if (summary.change === null || summary.changeSince === null) return null
	return t('changeSince', {
		change: formatBodyChange(summary.field, summary.change, unit, t),
		date: formatBodyDate(summary.changeSince, locale),
	})
}

export interface BodyWeightPoint {
	date: string
	weightKg: number
}

export function bodyWeightPoints(
	entries: BodyMeasurement[],
): BodyWeightPoint[] {
	return entries
		.filter(entry => entry.weightKg !== null)
		.map(entry => ({ date: entry.date, weightKg: entry.weightKg! }))
}

export interface BodyWeightChart {
	coordinates: Array<{ point: BodyWeightPoint; x: number; y: number }>
	/** Where the goal's target sits on the same scale, when there is one. */
	goalY: number | null
}

/**
 * Coordinates for the weight line. The goal's target joins the value scale so
 * its line is always inside the chart, however far it is from the weights.
 */
export function getBodyWeightChart(
	points: BodyWeightPoint[],
	goalKg: number | null,
	width: number,
	height: number,
	padding: number,
): BodyWeightChart {
	if (points.length === 0) return { coordinates: [], goalY: null }
	const times = points.map(point => Date.parse(`${point.date}T12:00:00Z`))
	const values = points.map(point => point.weightKg)
	const scale = goalKg === null ? values : [...values, goalKg]
	const minTime = Math.min(...times)
	const maxTime = Math.max(...times)
	const minValue = Math.min(...scale)
	const maxValue = Math.max(...scale)
	const innerWidth = width - padding * 2
	const innerHeight = height - padding * 2
	const y = (value: number) =>
		minValue === maxValue
			? height / 2
			: padding + (1 - (value - minValue) / (maxValue - minValue)) * innerHeight
	return {
		coordinates: points.map((point, index) => ({
			point,
			x:
				minTime === maxTime
					? width / 2
					: padding +
						((times[index] - minTime) / (maxTime - minTime)) * innerWidth,
			y: y(point.weightKg),
		})),
		goalY: goalKg === null ? null : y(goalKg),
	}
}

export interface BodyWeightGoalContext {
	targetKg: number
	target: string
	gap: string
	reached: boolean
}

/** The PROG-08 body-weight goal read against the latest weight. */
export function describeBodyWeightGoal(
	goals: MeasurableGoal[] | undefined,
	latestKg: number | null,
	unit: WeightUnit,
	t: Translator<'progress.body'>,
): BodyWeightGoalContext | null {
	const goal = goals?.find(entry => entry.type === 'BODY_WEIGHT')
	if (!goal) return null
	const atMost = goal.direction === 'AT_MOST'
	const value = formatBodyValue('weightKg', goal.targetValue, unit)
	const target = atMost
		? t('goalAtMost', { value })
		: t('goalAtLeast', { value })
	if (latestKg === null) {
		return {
			targetKg: goal.targetValue,
			target,
			gap: t('logAWeight'),
			reached: false,
		}
	}
	const remaining = atMost
		? latestKg - goal.targetValue
		: goal.targetValue - latestKg
	const reached = remaining <= 0.0025
	return {
		targetKg: goal.targetValue,
		target,
		gap: reached
			? t('goalReached')
			: t('toGo', {
					value: formatBodyValue('weightKg', remaining, unit),
				}),
		reached,
	}
}

export type BodyEntryDraft = { date: string } & Record<
	BodyMeasurementField,
	string
>

export function emptyBodyEntryDraft(date: string): BodyEntryDraft {
	return {
		date,
		weightKg: '',
		waistCm: '',
		hipsCm: '',
		chestCm: '',
		armCm: '',
		thighCm: '',
		bodyFatPercent: '',
	}
}

export function draftFromBodyEntry(
	entry: BodyMeasurement,
	unit: WeightUnit,
): BodyEntryDraft {
	const draft = emptyBodyEntryDraft(entry.date)
	for (const field of BODY_MEASUREMENT_FIELDS) {
		const value = entry[field.key]
		if (value === null) continue
		draft[field.key] =
			field.key === 'weightKg' ? formatWeightInput(value, unit) : String(value)
	}
	return draft
}

export type BodyEntryResult =
	| { request: UpsertBodyMeasurementRequest; problem: null; field: null }
	| {
			request: null
			problem: string
			field: BodyMeasurementField | 'date' | null
	  }

/**
 * Turns the form into a request, weight back into kilograms. The bounds and
 * the at-least-one rule are the contracts' own, so the form refuses exactly
 * what the server would, in the unit the member typed.
 */
export function bodyEntryRequest(
	draft: BodyEntryDraft,
	unit: WeightUnit,
	today: string,
	t: Translator<'progress.body'>,
): BodyEntryResult {
	if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(draft.date)) {
		return { request: null, problem: t('chooseADate'), field: 'date' }
	}
	if (draft.date > today) {
		return {
			request: null,
			problem: t('notInTheFuture'),
			field: 'date',
		}
	}
	const request: UpsertBodyMeasurementRequest = {}
	for (const field of BODY_MEASUREMENT_FIELDS) {
		const text = draft[field.key].trim()
		if (text === '') {
			request[field.key] = null
			continue
		}
		const value =
			field.key === 'weightKg' ? parseWeightInput(text, unit) : Number(text)
		if (value === undefined || !Number.isFinite(value)) {
			return {
				request: null,
				problem: `${field.label} must be a number`,
				field: field.key,
			}
		}
		request[field.key] = value
	}
	const [problem] = bodyMeasurementProblems(request)
	if (problem) {
		const message =
			problem.field === 'weightKg'
				? `Weight must be between ${formatBodyValue('weightKg', 20, unit)} and ${formatBodyValue('weightKg', 1000, unit)}`
				: problem.message
		return { request: null, problem: message, field: problem.field }
	}
	return { request, problem: null, field: null }
}

/** One line per entry for the owner's list: every value it records. */
export function describeBodyEntry(
	entry: BodyMeasurement,
	unit: WeightUnit,
	t: Translator<'progress.body'>,
): string {
	return BODY_MEASUREMENT_FIELDS.filter(field => entry[field.key] !== null)
		.map(field =>
			field.key === 'weightKg'
				? formatBodyValue(field.key, entry[field.key]!, unit)
				: t('entryField', {
						label: bodyFieldLabel(field.key, t),
						value: formatBodyValue(field.key, entry[field.key]!, unit),
					}),
		)
		.join(' · ')
}
