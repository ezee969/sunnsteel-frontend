import { routineDayLabel, type WeightUnit } from '@sunsteel/contracts'

import type { SetLog, WorkoutSession } from '@/lib/api/types/workout.type'
import { formatDuration } from '@/lib/utils/time-format.utils'
import {
	formatWeight as formatWeightForUnit,
	formatWeightAmount,
	getWeightUnitLabel,
} from '@/lib/utils/weight-unit'

/**
 * Formats a canonical kilogram value in the user's preferred unit.
 */
export function formatWeight(
	weight: number | null | undefined,
	weightUnit: WeightUnit,
): string {
	return formatWeightForUnit(weight, weightUnit)
}

/**
 * Formats a reps value, using em dash when not provided.
 */
export function formatReps(reps?: number | null): string {
	if (!reps) {
		return '—'
	}

	return `${reps}`
}

/**
 * Calculates the number of completed sets in a session.
 */
export function getCompletedSetsCount(setLogs?: SetLog[]): number {
	if (!setLogs?.length) {
		return 0
	}

	return setLogs.reduce(
		(count, log) => (log.isCompleted ? count + 1 : count),
		0,
	)
}

/**
 * Calculates total training volume (weight * reps) for completed sets.
 */
export function calculateTotalVolume(setLogs?: SetLog[]): number {
	if (!setLogs?.length) {
		return 0
	}

	return setLogs.reduce((total, log) => {
		if (log.isCompleted && log.weight && log.reps) {
			return total + log.weight * log.reps
		}

		return total
	}, 0)
}

export interface SessionMetrics {
	statusLabel: string
	dayLabel: string
	dateLabel: string
	durationLabel: string
	completedSets: number
	totalVolumeLabel: string
	notes?: string | null
}

/**
 * Builds common session metrics for UI presentation.
 */
export function buildSessionMetrics(
	session: WorkoutSession | undefined,
	weightUnit: WeightUnit,
): SessionMetrics {
	const completedSets = getCompletedSetsCount(session?.setLogs)
	const totalVolume = calculateTotalVolume(session?.setLogs)

	return {
		statusLabel: session?.status ?? 'UNKNOWN',
		dayLabel:
			(session?.routineDay && routineDayLabel(session.routineDay)) ||
			'Unknown Day',
		dateLabel: session?.startedAt
			? new Date(session.startedAt).toLocaleDateString()
			: 'Unknown Date',
		durationLabel: session?.durationSec
			? formatDuration(session.durationSec)
			: '—',
		completedSets,
		totalVolumeLabel: `${formatWeightAmount(totalVolume, weightUnit, 1)} ${getWeightUnitLabel(weightUnit)}`,
		notes: session?.notes ?? null,
	}
}
