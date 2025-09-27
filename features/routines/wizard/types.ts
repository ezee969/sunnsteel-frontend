import type { RepType, ProgressionScheme } from '@/lib/api/types/routine.shared'
export type { RepType, ProgressionScheme } from '@/lib/api/types/routine.shared'
// If hypertrophy variant becomes supported backend-side, extend shared enum there.

export interface RoutineSet {
	setNumber: number
	repType: RepType
	reps?: number | null
	minReps?: number | null
	maxReps?: number | null
	weight?: number | null
}

export interface RoutineWizardExercise {
	exerciseId: string
	progressionScheme: ProgressionScheme
	minWeightIncrement: number
	programTMKg?: number
	programRoundingKg?: number
	sets: RoutineSet[]
	restSeconds: number
}

export interface RoutineWizardDay {
	dayOfWeek: number
	exercises: RoutineWizardExercise[]
}

export interface RoutineWizardData {
	name: string
	description?: string
	trainingDays: number[]
	days: RoutineWizardDay[]
	programScheduleMode?: 'TIMEFRAME' | 'NONE'
	programWithDeloads?: boolean
	programStartDate?: string
	programTimezone?: string
	programStartWeek?: number
}
