import {
	BODY_MEASUREMENT_FIELDS,
	type BodyFieldSummary,
	type BodyMeasurement,
	type BodyMeasurementField,
	bodyMeasurementProblems,
	type BodyProgressRange,
	type LengthUnit,
	type MeasurableGoal,
	type UpsertBodyMeasurementRequest,
	type WeightUnit,
} from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import { dateFormatter, numberFormatter } from '@/i18n/date-locale'
import type { MessageKey, Translator } from '@/i18n/translator'

import {
	centimetresToDisplayLength,
	formatLengthInput,
	getLengthUnitLabel,
	parseLengthInput,
} from './length-unit'
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

// Body values read in the app's language, like every other number:
// `1,5 cm` in Spanish, `1.5 cm` in English.
const oneDecimal = (value: number, locale: Locale) =>
	numberFormatter(locale, { maximumFractionDigits: 1 }).format(value)

/** A stored value in the unit it is shown in: kg or lb, cm or in, %. */
function displayValue(
	field: BodyMeasurementField,
	value: number,
	unit: WeightUnit,
	lengthUnit: LengthUnit,
): number {
	if (field === 'weightKg') return kilogramsToDisplayWeight(value, unit)
	if (field === 'bodyFatPercent') return value
	return centimetresToDisplayLength(value, lengthUnit)
}

function unitSuffix(
	field: BodyMeasurementField,
	unit: WeightUnit,
	lengthUnit: LengthUnit,
): string {
	if (field === 'weightKg') return ` ${getWeightUnitLabel(unit)}`
	if (field === 'bodyFatPercent') return '%'
	return ` ${getLengthUnitLabel(lengthUnit)}`
}

/**
 * Weight in the account's unit, lengths in its length unit (PREF-04) and
 * body fat in %.
 */
export function formatBodyValue(
	field: BodyMeasurementField,
	value: number,
	unit: WeightUnit,
	locale: Locale,
	lengthUnit: LengthUnit = 'CM',
): string {
	return `${oneDecimal(displayValue(field, value, unit, lengthUnit), locale)}${unitSuffix(field, unit, lengthUnit)}`
}

/** A signed change; a change that rounds to nothing says so. */
export function formatBodyChange(
	field: BodyMeasurementField,
	change: number,
	unit: WeightUnit,
	t: Translator<'progress.body'>,
	locale: Locale,
	lengthUnit: LengthUnit = 'CM',
): string {
	const shown = displayValue(field, change, unit, lengthUnit)
	if (Math.abs(shown) < 0.05) return t('noChange')
	const sign = shown > 0 ? '+' : '-'
	return `${sign}${formatBodyValue(field, Math.abs(change), unit, locale, lengthUnit)}`
}

export function formatBodyDate(date: string, locale: Locale): string {
	return dateFormatter(locale, {
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
	lengthUnit: LengthUnit = 'CM',
): string | null {
	if (summary.change === null || summary.changeSince === null) return null
	return t('changeSince', {
		change: formatBodyChange(
			summary.field,
			summary.change,
			unit,
			t,
			locale,
			lengthUnit,
		),
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
	locale: Locale,
): BodyWeightGoalContext | null {
	const goal = goals?.find(entry => entry.type === 'BODY_WEIGHT')
	if (!goal) return null
	const atMost = goal.direction === 'AT_MOST'
	const value = formatBodyValue('weightKg', goal.targetValue, unit, locale)
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
					value: formatBodyValue('weightKg', remaining, unit, locale),
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
	lengthUnit: LengthUnit = 'CM',
): BodyEntryDraft {
	const draft = emptyBodyEntryDraft(entry.date)
	for (const field of BODY_MEASUREMENT_FIELDS) {
		const value = entry[field.key]
		if (value === null) continue
		draft[field.key] =
			field.key === 'weightKg'
				? formatWeightInput(value, unit)
				: field.key === 'bodyFatPercent'
					? String(value)
					: formatLengthInput(value, lengthUnit)
	}
	return draft
}

/**
 * A bound in the unit it is shown in, rounded inwards so that typing the
 * number the message names is always accepted: 10 cm is "4 in", not "3.9 in".
 */
function boundText(
	field: BodyMeasurementField,
	bound: number,
	side: 'min' | 'max',
	unit: WeightUnit,
	lengthUnit: LengthUnit,
	locale: Locale,
): string {
	const shown = displayValue(field, bound, unit, lengthUnit)
	const tenths =
		side === 'min'
			? Math.ceil(shown * 10 - 1e-9)
			: Math.floor(shown * 10 + 1e-9)
	return `${oneDecimal(tenths / 10, locale)}${unitSuffix(field, unit, lengthUnit)}`
}

export type BodyEntryResult =
	| { request: UpsertBodyMeasurementRequest; problem: null; field: null }
	| {
			request: null
			problem: string
			field: BodyMeasurementField | 'date' | null
	  }

/**
 * Turns the form into a request, weight back into kilograms and lengths into
 * centimetres. The bounds and the at-least-one rule are the contracts' own,
 * applied after the conversion, so the form refuses exactly what the server
 * would, in the unit the member typed.
 */
export function bodyEntryRequest(
	draft: BodyEntryDraft,
	unit: WeightUnit,
	today: string,
	t: Translator<'progress.body'>,
	locale: Locale,
	lengthUnit: LengthUnit = 'CM',
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
			field.key === 'weightKg'
				? parseWeightInput(text, unit)
				: field.key === 'bodyFatPercent'
					? Number(text)
					: parseLengthInput(text, lengthUnit)
		if (value === undefined || !Number.isFinite(value)) {
			return {
				request: null,
				problem: t('notANumber', { label: bodyFieldLabel(field.key, t) }),
				field: field.key,
			}
		}
		request[field.key] = value
	}
	const [problem] = bodyMeasurementProblems(request)
	if (problem) {
		const field = BODY_MEASUREMENT_FIELDS.find(
			entry => entry.key === problem.field,
		)
		const message = field
			? t('outOfRange', {
					label: bodyFieldLabel(field.key, t),
					min: boundText(field.key, field.min, 'min', unit, lengthUnit, locale),
					max: boundText(field.key, field.max, 'max', unit, lengthUnit, locale),
				})
			: t('atLeastOne')
		return { request: null, problem: message, field: problem.field }
	}
	return { request, problem: null, field: null }
}

/** One line per entry for the owner's list: every value it records. */
export function describeBodyEntry(
	entry: BodyMeasurement,
	unit: WeightUnit,
	t: Translator<'progress.body'>,
	locale: Locale,
	lengthUnit: LengthUnit = 'CM',
): string {
	return BODY_MEASUREMENT_FIELDS.filter(field => entry[field.key] !== null)
		.map(field => {
			const value = formatBodyValue(
				field.key,
				entry[field.key]!,
				unit,
				locale,
				lengthUnit,
			)
			return field.key === 'weightKg'
				? value
				: t('entryField', { label: bodyFieldLabel(field.key, t), value })
		})
		.join(' · ')
}
