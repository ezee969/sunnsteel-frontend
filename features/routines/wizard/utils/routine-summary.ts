import { CreateRoutineRequest } from '@/lib/api/types'

import type { RoutineWizardData } from '../types'

export const DAYS_OF_WEEK = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
] as const

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
		isPeriodized: false,
		days: data.days.map((day, dayIndex) => ({
			dayOfWeek: day.dayOfWeek,
			order: dayIndex,
			exercises: day.exercises.map((exercise, exerciseIndex) => ({
				exerciseId: exercise.exerciseId,
				order: exerciseIndex,
				restSeconds: exercise.restSeconds,
				note: exercise.note,
				progressionScheme: exercise.progressionScheme,
				minWeightIncrement: exercise.minWeightIncrement,
				sets: exercise.sets.map(set => {
					const baseSet = {
						setNumber: set.setNumber,
						...(set.weight !== undefined &&
							set.weight !== null && { weight: set.weight }),
						...(set.rir !== undefined && set.rir !== null && { rir: set.rir }),
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
