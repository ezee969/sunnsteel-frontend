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
	data.days.some(day =>
		day.exercises.some(exercise => isRtFExercise(exercise.progressionScheme)),
	)

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
	const startWeek = Math.min(
		Math.max(data.programStartWeek ?? 1, 1),
		totalWeeks,
	)
	return { totalWeeks, startWeek }
}

export const resolveProgramTimezone = (data: RoutineWizardData) => {
	const candidateRaw = (data.programTimezone ?? '').trim()
	const normalize = (tz: string) => {
		const map: Record<string, string> = {
			'America/Buenos_Aires': 'America/Argentina/Buenos_Aires',
		}
		return map[tz] ?? tz
	}
	const isValid = (tz: string) => {
		try {
			// Prefer modern API when available
			const supported = Intl.supportedValuesOf?.('timeZone') as
				| string[]
				| undefined
			if (Array.isArray(supported)) {
				return supported.includes(tz)
			}
			// Fallback: attempt formatting using provided timeZone
			new Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date())
			return true
		} catch {
			return false
		}
	}
	const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone
	const candidate = candidateRaw ? normalize(candidateRaw) : browserTz
	if (candidate && isValid(candidate)) return candidate
	if (browserTz && isValid(browserTz)) return browserTz
	return 'UTC'
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
	const deriveProgramStyle = (): 'STANDARD' | 'HYPERTROPHY' | undefined => {
		const hasHyp = data.days.some(day =>
			day.exercises.some(
				ex => ex.progressionScheme === 'PROGRAMMED_RTF_HYPERTROPHY',
			),
		)
		const hasStd = data.days.some(day =>
			day.exercises.some(ex => ex.progressionScheme === 'PROGRAMMED_RTF'),
		)
		if (hasHyp) return 'HYPERTROPHY'
		if (hasStd) return 'STANDARD'
		return undefined
	}
	const programStyle = deriveProgramStyle()

	const canonicalRtfSetsFor = (scheme: ProgressionScheme) => {
		if (scheme === 'PROGRAMMED_RTF_HYPERTROPHY') {
			// 3 fixed sets at 10 reps + 1 AMRAP placeholder
			return [
				{ setNumber: 1, repType: 'FIXED' as const, reps: 10 },
				{ setNumber: 2, repType: 'FIXED' as const, reps: 10 },
				{ setNumber: 3, repType: 'FIXED' as const, reps: 10 },
				{ setNumber: 4, repType: 'FIXED' as const, reps: 1 },
			]
		}
		if (scheme === 'PROGRAMMED_RTF') {
			// 4 fixed sets at 5 reps + 1 AMRAP placeholder
			return [
				{ setNumber: 1, repType: 'FIXED' as const, reps: 5 },
				{ setNumber: 2, repType: 'FIXED' as const, reps: 5 },
				{ setNumber: 3, repType: 'FIXED' as const, reps: 5 },
				{ setNumber: 4, repType: 'FIXED' as const, reps: 5 },
				{ setNumber: 5, repType: 'FIXED' as const, reps: 1 },
			]
		}
		return []
	}
	return {
		name: data.name,
		description: data.description,
		isPeriodized: false,
		...(rtF &&
			data.programScheduleMode === 'TIMEFRAME' && {
				programWithDeloads: data.programWithDeloads,
				programStartDate: data.programStartDate,
				programTimezone: tz,
				...(programStyle && { programStyle }),
				...// Include on create when provided; on edit only if user explicitly changed it
				(data.programStartWeek && (!isEditing || data.programStartWeekExplicit)
					? { programStartWeek: data.programStartWeek }
					: {}),
			}),
		days: data.days.map((day, dayIndex) => ({
			dayOfWeek: day.dayOfWeek,
			order: dayIndex,
			exercises: day.exercises.map((exercise, exerciseIndex) => {
				const isRtF = isRtFExercise(exercise.progressionScheme)
				const schemeUnified: ProgressionScheme = isRtF
					? 'PROGRAMMED_RTF'
					: exercise.progressionScheme
				const perExerciseStyle: 'STANDARD' | 'HYPERTROPHY' | undefined = isRtF
					? exercise.progressionScheme === 'PROGRAMMED_RTF_HYPERTROPHY'
						? 'HYPERTROPHY'
						: 'STANDARD'
					: undefined

				return {
					exerciseId: exercise.exerciseId,
					order: exerciseIndex,
					restSeconds: exercise.restSeconds,
					note: exercise.note,
					progressionScheme: schemeUnified,
					minWeightIncrement: exercise.minWeightIncrement,
					...(isRtF && {
						...(exercise.programTMKg !== undefined && {
							programTMKg: exercise.programTMKg,
						}),
						...(exercise.programRoundingKg !== undefined && {
							programRoundingKg: exercise.programRoundingKg,
						}),
						...(perExerciseStyle && { programStyle: perExerciseStyle }),
					}),
					sets: isRtF
						? canonicalRtfSetsFor(exercise.progressionScheme)
						: exercise.sets.map(set => {
								const baseSet = {
									setNumber: set.setNumber,
									...(set.weight !== undefined &&
										set.weight !== null && { weight: set.weight }),
									...(set.rir !== undefined &&
										set.rir !== null && { rir: set.rir }),
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
				}
			}),
		})),
	}
}
