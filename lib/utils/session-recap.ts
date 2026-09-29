import type {
	PersonalRecordKind,
	SessionRecapRecord,
	WeightUnit,
} from '@sunsteel/contracts'

import type { Translator } from '@/i18n/translator'

import { formatDuration } from './time-format.utils'
import { formatWeightAmount, getWeightUnitLabel } from './weight-unit'

export function recapRecordLabel(
	kind: PersonalRecordKind,
	t: Translator<'workout.recap'>,
): string {
	return t(`recordLabel.${kind}`)
}

export function formatRecapRecordValue(
	record: SessionRecapRecord,
	weightUnit: WeightUnit,
	t: Translator<'workout.recap'>,
): string {
	if (record.kind === 'REPS') return t('repsValue', { count: record.value })
	return `${formatWeightAmount(record.value, weightUnit, 1)} ${getWeightUnitLabel(weightUnit)}`
}

export function formatRecapDurationDelta(
	deltaSec: number,
	t: Translator<'workout.recap'>,
): string {
	if (deltaSec === 0) return t('noChange')
	return `${deltaSec > 0 ? '+' : '−'}${formatDuration(Math.abs(deltaSec))}`
}

export function formatRecapWeightDelta(
	deltaKg: number,
	weightUnit: WeightUnit,
	t: Translator<'workout.recap'>,
): string {
	if (deltaKg === 0) return t('noChange')
	return `${deltaKg > 0 ? '+' : '−'}${formatWeightAmount(
		Math.abs(deltaKg),
		weightUnit,
		1,
	)} ${getWeightUnitLabel(weightUnit)}`
}

export function formatRecapSetsDelta(
	delta: number,
	t: Translator<'workout.recap'>,
): string {
	if (delta === 0) return t('noChange')
	return `${delta > 0 ? '+' : '−'}${t('setsValue', { count: Math.abs(delta) })}`
}
