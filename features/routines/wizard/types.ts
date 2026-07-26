import type { ProgressionScheme, RepType } from '@/lib/api/types/routine.shared'
export type { ProgressionScheme, RepType } from '@/lib/api/types/routine.shared'

export interface RoutineSet {
	setNumber: number
	repType: RepType
	reps?: number | null
	minReps?: number | null
	maxReps?: number | null
	weight?: number | null
	rir?: number | null
}

export interface RoutineWizardExercise {
	/**
	 * Client-only stable identifier used for UI concerns (e.g. drag-and-drop keys).
	 * Not sent to the backend.
	 */
	clientId?: string
	exerciseId: string
	progressionScheme: ProgressionScheme
	minWeightIncrement: number
	note?: string
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
}
