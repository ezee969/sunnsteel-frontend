import { useMemo } from 'react'
import { generateRepsToFailureProgram } from '@/lib/utils/reps-to-failure'
import { deriveAdjustmentsFromLog, TmTrendBuffer } from '@/lib/analytics/tm-trend'
import type { RoutineWizardData, RoutineWizardExercise } from '../types'
import type { ProgressionScheme } from '@/lib/api/types/routine.shared'

const RTF_SCHEMES: readonly ProgressionScheme[] = [
	'PROGRAMMED_RTF',
	'PROGRAMMED_RTF_HYPERTROPHY',
] as const

export const isRtfScheme = (scheme: ProgressionScheme): boolean =>
	RTF_SCHEMES.includes(scheme)

export const extractRtfExercises = (
	days: RoutineWizardData['days'],
): RoutineWizardExercise[] =>
	days.flatMap((day) => day.exercises.filter((exercise) => isRtfScheme(exercise.progressionScheme)))

const getRtfStyle = (exercise: RoutineWizardExercise | undefined) => {
	switch (exercise?.progressionScheme) {
		case 'PROGRAMMED_RTF_HYPERTROPHY':
			return 'HYPERTROPHY' as const
		case 'PROGRAMMED_RTF':
		default:
			return 'STANDARD' as const
	}
}

interface BuildProgramParams {
	exercise: RoutineWizardExercise | undefined
	withDeloads: boolean | undefined
}

const buildProgram = ({ exercise, withDeloads }: BuildProgramParams) => {
	if (!exercise) {
		return [] as ReturnType<typeof generateRepsToFailureProgram>
	}

	const tm = exercise.programTMKg ?? 100
	const rounding = exercise.programRoundingKg ?? 5
	const style = getRtfStyle(exercise)
	const includeDeloads = withDeloads !== false

	return generateRepsToFailureProgram(
		{
			initialWeight: tm,
			style,
			withDeloads: includeDeloads,
			roundingIncrementKg: rounding,
		},
		[],
	)
}

export const useRtfPreview = (
	exercise: RoutineWizardExercise | undefined,
	withDeloads: boolean | undefined,
) =>
	useMemo(() => {
		const program = buildProgram({ exercise, withDeloads })
		return program.slice(0, 6).map((row) => ({
			week: row.week,
			goal: row.goal,
			weight: row.weight,
		}))
	}, [exercise, withDeloads])

export const useFullRtfProgram = (
	exercise: RoutineWizardExercise | undefined,
	withDeloads: boolean | undefined,
) => useMemo(() => buildProgram({ exercise, withDeloads }), [exercise, withDeloads])

export const useTmTrendSnapshot = (
	program: ReturnType<typeof generateRepsToFailureProgram>,
	exercise: RoutineWizardExercise | undefined,
) =>
	useMemo(() => {
		if (!program.length) {
			return null
		}

		const buffer = new TmTrendBuffer()
		const style = getRtfStyle(exercise)

		deriveAdjustmentsFromLog(program, style, exercise?.exerciseId).forEach((entry) =>
			buffer.push(entry),
		)

		return buffer.snapshot(style, exercise?.exerciseId)
	}, [exercise, program])
