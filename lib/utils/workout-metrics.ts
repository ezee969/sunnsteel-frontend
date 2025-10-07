import type { SetLog, WorkoutSession } from '@/lib/api/types/workout.type'
import { formatTimeReadable } from '@/lib/utils/time'

/**
 * Returns the day name for a given ISO day of week (0 = Sunday).
 */
export function getDayName(dayOfWeek?: number): string {
	if (dayOfWeek === undefined || dayOfWeek === null) {
		return 'Unknown Day'
	}

	const days = [
		' Sunday',
		' Monday',
		' Tuesday',
		' Wednesday',
		' Thursday',
		' Friday',
		' Saturday',
	].map((day) => day.trim())

	return days[dayOfWeek] ?? 'Unknown Day'
}

/**
 * Formats a numeric weight value in kilograms with units.
 */
export function formatWeight(weight?: number | null): string {
	if (!weight) {
		return '—'
	}

	return `${weight} kg`
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

	return setLogs.reduce((count, log) => (log.isCompleted ? count + 1 : count), 0)
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

/**
 * Formats a numeric kilogram value with one decimal place and unit suffix.
 */
export function formatKg(value: number): string {
	return `${value.toFixed(1)} kg`
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
export function buildSessionMetrics(session?: WorkoutSession): SessionMetrics {
	const completedSets = getCompletedSetsCount(session?.setLogs)
	const totalVolume = calculateTotalVolume(session?.setLogs)

	return {
		statusLabel: session?.status ?? 'UNKNOWN',
		dayLabel: getDayName(session?.routineDay?.dayOfWeek),
		dateLabel: session?.startedAt
			? new Date(session.startedAt).toLocaleDateString()
			: 'Unknown Date',
		durationLabel: session?.durationSec
			? formatTimeReadable(session.durationSec)
			: '—',
		completedSets,
		totalVolumeLabel: formatKg(totalVolume),
		notes: session?.notes ?? null,
	}
}
