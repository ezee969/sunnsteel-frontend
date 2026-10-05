import { CreateRoutineRequest } from '@/lib/api/types'

import type { RoutineWizardData } from '../types'
import { isLpWorkingSet } from './linear-block'

export interface RoutineTotals {
	trainingDays: number
	totalExercises: number
	totalSets: number
}

export const computeRoutineTotals = (
	data: RoutineWizardData,
): RoutineTotals => {
	const trainingDays = data.trainingDays.length

	let totalExercises = 0
	let totalSets = 0

	for (const day of data.days) {
		totalExercises += day.exercises.length

		for (const exercise of day.exercises) {
			totalSets += exercise.sets.length
		}
	}

	return { trainingDays, totalExercises, totalSets }
}

export const buildRoutineRequest = (
	data: RoutineWizardData,
): CreateRoutineRequest => {
	return {
		name: data.name,
		description: data.description,
		// ROUT-07: null clears the claim; it is never omitted, so editing a
		// routine back to "not specified" actually removes what it declared.
		goal: data.goal ?? null,
		experienceLevel: data.experienceLevel ?? null,
		isPeriodized: false,
		scheduleMode: data.scheduleMode,
		restDays:
			data.scheduleMode === 'ROTATION'
				? []
				: [...data.restDays].sort((a, b) => a - b),
		rotationWeekdays:
			data.scheduleMode === 'ROTATION'
				? [...data.rotationWeekdays].sort((a, b) => a - b)
				: [],
		days: data.days.map((day, dayIndex) => ({
			// ROUT-11: rotation days run in order and have no weekday.
			dayOfWeek: data.scheduleMode === 'ROTATION' ? null : day.slot,
			name: day.name?.trim() || null,
			order: dayIndex,
			exercises: day.exercises.map((exercise, exerciseIndex) => ({
				exerciseId: exercise.exerciseId,
				order: exerciseIndex,
				restSeconds: exercise.restSeconds,
				note: exercise.note,
				progressionScheme: exercise.progressionScheme,
				minWeightIncrement: exercise.minWeightIncrement,
				warmUpsFollowLoad: Boolean(exercise.warmUpsFollowLoad),
				linkedToNext: Boolean(exercise.linkedToNext),
				// ROUT-17: null clears a block's state when the scheme changed;
				// the server regenerates an LP exercise's working sets from it.
				linearPeriodization:
					exercise.progressionScheme === 'LINEAR_PERIODIZATION'
						? (exercise.linearPeriodization ?? null)
						: null,
				sets: exercise.sets.map(set => {
					const baseSet = {
						setNumber: set.setNumber,
						...(set.weight !== undefined &&
							set.weight !== null && { weight: set.weight }),
						...(set.rir !== undefined && set.rir !== null && { rir: set.rir }),
						// LIVE-12: sent always, so editing a set back to working sticks.
						kind: set.kind ?? 'WORKING',
						// LIVE-20: a generated warm-up's share of the working load.
						...(set.kind === 'WARMUP' && typeof set.warmUpShare === 'number'
							? { warmUpShare: set.warmUpShare }
							: {}),
					}

					// ROUT-17: a block's working sets have no rep target.
					if (isLpWorkingSet(exercise, set)) {
						return {
							...baseSet,
							repType: 'FIXED' as const,
							reps: set.reps ?? null,
						}
					}

					if (set.repType === 'FIXED') {
						return {
							...baseSet,
							repType: 'FIXED' as const,
							reps: set.reps ?? 0,
						}
					}

					return {
						...baseSet,
						repType: 'RANGE' as const,
						minReps: set.minReps ?? 0,
						maxReps: set.maxReps ?? 0,
					}
				}),
			})),
		})),
	}
}
