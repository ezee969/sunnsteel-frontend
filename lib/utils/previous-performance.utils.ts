import type { WeightUnit } from '@sunsteel/contracts'

import type { Translator } from '@/i18n/translator'
import type { PreviousSetPerformance } from '@/lib/api/types/workout.type'
import { areCanonicalWeightsEqual, formatWeight } from '@/lib/utils/weight-unit'

type CurrentSetPerformance = {
	reps: number
	weight?: number | null
}

export function isSetPerformanceImproved(
	current: CurrentSetPerformance,
	previous: PreviousSetPerformance,
): boolean {
	if (!Number.isFinite(current.reps) || current.reps <= 0) return false

	const currentWeight = current.weight ?? 0
	const previousWeight = previous.weight ?? 0
	if (!Number.isFinite(currentWeight)) return false

	return areCanonicalWeightsEqual(currentWeight, previousWeight)
		? current.reps > previous.reps
		: currentWeight > previousWeight
}

export function formatPreviousPerformance(
	previous: PreviousSetPerformance,
	weightUnit: WeightUnit,
	t: Translator<'workout.previousPerformance'>,
): string {
	const reps = t('repsValue', { count: previous.reps })
	const weight =
		previous.weight === null ||
		previous.weight === undefined ||
		previous.weight === 0
			? ''
			: ` · ${formatWeight(previous.weight, weightUnit)}`
	return `${reps}${weight}`
}
