import type {
	PersonalRecordKind,
	SessionRecapRecord,
	WeightUnit,
} from '@sunsteel/contracts'

import { formatDuration } from './time-format.utils'
import { formatWeightAmount, getWeightUnitLabel } from './weight-unit'

export const RECAP_RECORD_LABELS: Record<PersonalRecordKind, string> = {
	WEIGHT: 'Weight record',
	REPS: 'Rep record',
	VOLUME: 'Set volume record',
	ESTIMATED_1RM: 'Estimated 1RM record',
}

export function formatRecapRecordValue(
	record: SessionRecapRecord,
	weightUnit: WeightUnit,
): string {
	if (record.kind === 'REPS') return `${record.value} reps`
	return `${formatWeightAmount(record.value, weightUnit, 1)} ${getWeightUnitLabel(weightUnit)}`
}

export function formatRecapDurationDelta(deltaSec: number): string {
	if (deltaSec === 0) return 'No change'
	return `${deltaSec > 0 ? '+' : '−'}${formatDuration(Math.abs(deltaSec))}`
}

export function formatRecapWeightDelta(
	deltaKg: number,
	weightUnit: WeightUnit,
): string {
	if (deltaKg === 0) return 'No change'
	return `${deltaKg > 0 ? '+' : '−'}${formatWeightAmount(
		Math.abs(deltaKg),
		weightUnit,
		1,
	)} ${getWeightUnitLabel(weightUnit)}`
}

export function formatRecapSetsDelta(delta: number): string {
	if (delta === 0) return 'No change'
	return `${delta > 0 ? '+' : '−'}${Math.abs(delta)} set${
		Math.abs(delta) === 1 ? '' : 's'
	}`
}
