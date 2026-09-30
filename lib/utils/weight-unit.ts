import type { WeightUnit } from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import { numberFormatter } from '@/i18n/date-locale'

export const POUNDS_PER_KILOGRAM = 2.2046226218
export const WEIGHT_EQUALITY_TOLERANCE_KG = 0.0025

const INPUT_DECIMALS = 2
const CANONICAL_DECIMALS = 6

function roundTo(value: number, decimals: number): number {
	const factor = 10 ** decimals
	return Math.round((value + Number.EPSILON) * factor) / factor
}

export function getWeightUnitLabel(unit: WeightUnit): 'kg' | 'lb' {
	return unit === 'LB' ? 'lb' : 'kg'
}

export function kilogramsToDisplayWeight(
	weightKg: number,
	unit: WeightUnit,
): number {
	return unit === 'LB' ? weightKg * POUNDS_PER_KILOGRAM : weightKg
}

export function displayWeightToKilograms(
	weight: number,
	unit: WeightUnit,
): number {
	const weightKg = unit === 'LB' ? weight / POUNDS_PER_KILOGRAM : weight
	return roundTo(weightKg, CANONICAL_DECIMALS)
}

export function formatWeightInput(
	weightKg: number | null | undefined,
	unit: WeightUnit,
): string {
	if (weightKg === null || weightKg === undefined) return ''
	return String(
		roundTo(kilogramsToDisplayWeight(weightKg, unit), INPUT_DECIMALS),
	)
}

export function parseWeightInput(
	value: string,
	unit: WeightUnit,
): number | undefined {
	const trimmed = value.trim()
	if (trimmed === '') return undefined

	const parsed = Number.parseFloat(trimmed)
	if (!Number.isFinite(parsed) || parsed < 0) return undefined

	return displayWeightToKilograms(parsed, unit)
}

export function areCanonicalWeightsEqual(
	left: number | null | undefined,
	right: number | null | undefined,
): boolean {
	if (left == null || right == null) return left == null && right == null
	return Math.abs(left - right) <= WEIGHT_EQUALITY_TOLERANCE_KG
}

export function formatWeight(
	weightKg: number | null | undefined,
	unit: WeightUnit,
	locale: Locale,
): string {
	if (!weightKg) return '—'
	// `useGrouping: false` keeps this exactly as it read before the language
	// reached it -- `String(1763.7)`, never `1,763.7`. Only the decimal mark
	// moves, which is the whole point: 1763,7 in Spanish.
	const value = numberFormatter(locale, {
		maximumFractionDigits: INPUT_DECIMALS,
		useGrouping: false,
	}).format(kilogramsToDisplayWeight(weightKg, unit))
	return `${value} ${getWeightUnitLabel(unit)}`
}

/**
 * The number a member reads, in the language they chose. `formatWeightInput`
 * above stays unlocalised on purpose: it fills a text field that
 * `parseWeightInput` reads back, so its decimal point is machine syntax
 * rather than copy.
 */
export function formatWeightAmount(
	weightKg: number,
	unit: WeightUnit,
	locale: Locale,
	maximumFractionDigits = 2,
): string {
	const value = kilogramsToDisplayWeight(weightKg, unit)
	return numberFormatter(locale, { maximumFractionDigits }).format(value)
}

export function stepCanonicalWeight(
	weightKg: number,
	unit: WeightUnit,
	delta: number,
): number {
	const increment = unit === 'LB' ? 1 : 0.5
	const currentDisplay = kilogramsToDisplayWeight(weightKg, unit)
	const nextDisplay = roundTo(
		Math.max(0, currentDisplay + delta * increment),
		INPUT_DECIMALS,
	)
	return displayWeightToKilograms(nextDisplay, unit)
}
