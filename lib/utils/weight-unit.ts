import type { WeightUnit } from '@sunsteel/contracts'

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
): string {
	if (!weightKg) return '—'
	return `${formatWeightInput(weightKg, unit)} ${getWeightUnitLabel(unit)}`
}

export function formatWeightAmount(
	weightKg: number,
	unit: WeightUnit,
	maximumFractionDigits = 2,
): string {
	const value = kilogramsToDisplayWeight(weightKg, unit)
	return new Intl.NumberFormat(undefined, {
		maximumFractionDigits,
	}).format(value)
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
