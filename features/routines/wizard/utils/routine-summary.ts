import { CreateRoutineRequest } from '@/lib/api/types'
import type { RoutineWizardData } from '../types'
import type { ProgressionScheme } from '../types'
import {
	isRtFExercise,
	isRtFHypertrophy,
	isRtFStandard,
	getRtfSetSummary,
	RTF_HYPERTROPHY_SET_COUNT,
	RTF_STANDARD_SET_COUNT,
} from './progression.helpers'

export {
	isRtFExercise,
	isRtFHypertrophy,
	isRtFStandard,
	getRtfSetSummary,
} from './progression.helpers'

export const DAYS_OF_WEEK = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
] as const

export const hasRtFExercises = (data: RoutineWizardData) =>
	data.days.some((day) => day.exercises.some((exercise) => isRtFExercise(exercise.progressionScheme)))

export interface RoutineTotals {
	trainingDays: number
	totalExercises: number
	totalSets: number
}

export const computeRoutineTotals = (data: RoutineWizardData): RoutineTotals => {
	const trainingDays = data.trainingDays.length

	let totalExercises = 0
	let totalSets = 0

	for (const day of data.days) {
		totalExercises += day.exercises.length

		for (const exercise of day.exercises) {
			if (isRtFStandard(exercise.progressionScheme)) {
				totalSets += RTF_STANDARD_SET_COUNT
				continue
			}
			if (isRtFHypertrophy(exercise.progressionScheme)) {
				totalSets += RTF_HYPERTROPHY_SET_COUNT
				continue
			}
			totalSets += exercise.sets.length
		}
	}

	return { trainingDays, totalExercises, totalSets }
}

export const getProgramWeekInfo = (data: RoutineWizardData) => {
	const totalWeeks = data.programWithDeloads ? 21 : 18
	const startWeek = Math.min(Math.max(data.programStartWeek ?? 1, 1), totalWeeks)
	return { totalWeeks, startWeek }
}

export const resolveProgramTimezone = (data: RoutineWizardData) => {
	const candidate = (data.programTimezone ?? '').trim()
	if (candidate.length > 0) {
		return candidate
	}
	return Intl.DateTimeFormat().resolvedOptions().timeZone
}

interface BuildRoutineRequestOptions {
	isEditing: boolean
	usesRtf?: boolean
	timezone?: string
}

export const buildRoutineRequest = (
	data: RoutineWizardData,
	{ isEditing, usesRtf, timezone }: BuildRoutineRequestOptions,
): CreateRoutineRequest => {
	const rtF = usesRtf ?? hasRtFExercises(data)
	const tz = timezone ?? resolveProgramTimezone(data)
	return {
		name: data.name,
		description: data.description,
		isPeriodized: false,
		...(rtF &&
			data.programScheduleMode === 'TIMEFRAME' && {
				programWithDeloads: data.programWithDeloads,
				programStartDate: data.programStartDate,
				programTimezone: tz,
				...(!isEditing && data.programStartWeek && { programStartWeek: data.programStartWeek }),
			}),
		days: data.days.map((day, dayIndex) => ({
			dayOfWeek: day.dayOfWeek,
			order: dayIndex,
			exercises: day.exercises.map((exercise, exerciseIndex) => ({
				exerciseId: exercise.exerciseId,
				order: exerciseIndex,
				restSeconds: exercise.restSeconds,
				progressionScheme: exercise.progressionScheme,
				minWeightIncrement: exercise.minWeightIncrement,
				...(isRtFExercise(exercise.progressionScheme) && {
					...(exercise.programTMKg !== undefined && { programTMKg: exercise.programTMKg }),
					...(exercise.programRoundingKg !== undefined && { programRoundingKg: exercise.programRoundingKg }),
				}),
				sets: exercise.sets.map((set) => {
					const baseSet = {
						setNumber: set.setNumber,
						...(set.weight !== undefined && set.weight !== null && { weight: set.weight }),
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
