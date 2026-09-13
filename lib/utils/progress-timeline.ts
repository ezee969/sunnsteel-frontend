import type {
	ProgressTimelinePersonalRecordItem,
	WeightUnit,
} from '@sunsteel/contracts'

import { formatWeightAmount, getWeightUnitLabel } from './weight-unit'

function performanceLabel(
	performance: ProgressTimelinePersonalRecordItem['current'],
	unit: WeightUnit,
) {
	return `${formatWeightAmount(performance.weightKg, unit, 2)} ${getWeightUnitLabel(unit)} × ${performance.reps}`
}

export function getRecordTimelineExplanation(
	item: ProgressTimelinePersonalRecordItem,
	unit: WeightUnit,
): string {
	if (!item.previous || item.reason === 'FIRST_RECORDED_BEST') {
		return 'This was the first recorded best set for this exercise.'
	}
	if (item.reason === 'HEAVIER_LOAD') {
		return `The load moved beyond the previous best of ${performanceLabel(item.previous, unit)}.`
	}
	const addedReps = item.current.reps - item.previous.reps
	return `The same best load was completed for ${addedReps} more ${addedReps === 1 ? 'rep' : 'reps'} than before.`
}

export function getRecordTimelinePerformanceLabel(
	item: ProgressTimelinePersonalRecordItem,
	unit: WeightUnit,
) {
	return performanceLabel(item.current, unit)
}
