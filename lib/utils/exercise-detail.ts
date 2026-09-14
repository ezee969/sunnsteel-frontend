import type { Routine, RoutineSet } from '@sunsteel/contracts'

import { weekdayName } from './date'

/**
 * EXER-01: where one exercise appears in the owner's current routines. Pure,
 * so it runs in the Node test environment; the routines come from the cached
 * `useRoutines` list, which already carries every day and prescription.
 */

export interface RoutineUsageDay {
	dayId: string
	dayName: string
	/** One entry per slot on that day, e.g. "3 × 8–12". */
	schemes: string[]
}

export interface RoutineUsage {
	routineId: string
	routineName: string
	days: RoutineUsageDay[]
}

const repsLabel = (set: RoutineSet): string | null => {
	if (set.repType === 'RANGE') {
		return set.minReps != null && set.maxReps != null
			? `${set.minReps}–${set.maxReps}`
			: null
	}
	return set.reps != null ? String(set.reps) : null
}

/**
 * "3 × 8–12" when every set shares a target, otherwise the per-set targets
 * ("3 sets · 10, 8, 6 reps"), and just the count when a target is missing.
 */
export function formatSetScheme(sets: readonly RoutineSet[]): string {
	if (sets.length === 0) return 'No sets'
	const labels = sets.map(repsLabel)
	const count = `${sets.length} ${sets.length === 1 ? 'set' : 'sets'}`
	if (labels.some(label => label === null)) return count
	return new Set(labels).size === 1
		? `${sets.length} × ${labels[0]}`
		: `${count} · ${labels.join(', ')} reps`
}

export function findRoutineUsages(
	routines: readonly Routine[],
	exerciseId: string,
): RoutineUsage[] {
	return routines
		.map(routine => ({
			routineId: routine.id,
			routineName: routine.name,
			days: [...routine.days]
				.sort((a, b) => a.order - b.order || a.dayOfWeek - b.dayOfWeek)
				.flatMap(day => {
					const slots = [...day.exercises]
						.sort((a, b) => a.order - b.order)
						.filter(slot => slot.exercise.id === exerciseId)
					return slots.length > 0
						? [
								{
									dayId: day.id,
									dayName: weekdayName(day.dayOfWeek, 'long'),
									schemes: slots.map(slot => formatSetScheme(slot.sets)),
								},
							]
						: []
				}),
		}))
		.filter(usage => usage.days.length > 0)
		.sort((a, b) =>
			a.routineName.localeCompare(b.routineName, undefined, {
				sensitivity: 'base',
			}),
		)
}
