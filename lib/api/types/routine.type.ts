// Re-export shared primitive enums to maintain backwards compatible imports.
import type { RepType, ProgressionScheme } from './routine.shared'
export type { RepType, ProgressionScheme } from './routine.shared'
import type { RtfWeekGoals } from './rtf.types'
import type { ProgramStyle } from '@sunsteel/contracts'

export interface RoutineSet {
	setNumber: number
	repType: RepType
	reps?: number | null
	minReps?: number | null
	maxReps?: number | null
	weight?: number | null
	rir?: number | null
}

export interface RoutineExercise {
	id: string
	order: number
	restSeconds: number
	progressionScheme: ProgressionScheme
	minWeightIncrement: number
	// RtF-specific (present when progressionScheme = PROGRAMMED_RTF)
	programTMKg?: number
	programRoundingKg?: number
	// Unified scheme variant persisted server-side
	programStyle?: ProgramStyle
	exercise: {
		id: string
		name: string
	}
	sets: RoutineSet[]
}

export interface RoutineDay {
	id: string
	dayOfWeek: number
	order: number
	exercises: RoutineExercise[]
}

export interface Routine {
	id: string
	userId: string
	name: string
	description?: string
	isPeriodized: boolean
	programStyle?: ProgramStyle
	isFavorite: boolean
	isCompleted: boolean
	createdAt: string
	updatedAt: string
	// Optional program schedule fields (present for RtF routines when backend returns them)
	programWithDeloads?: boolean
	programDurationWeeks?: number
	programStartWeek?: number
	programStartDate?: string // ISO date string
	programEndDate?: string // ISO date string
	programTimezone?: string // IANA tz
	// RTF week goals (populated when ?include=rtfGoals is used)
	rtfGoals?: RtfWeekGoals
	days: RoutineDay[]
}

// Request types
export interface CreateRoutineRequest {
	name: string
	description?: string
	isPeriodized: boolean
	// Routine-level program fields (only when any exercise uses PROGRAMMED_RTF)
	programWithDeloads?: boolean // true=21; false=18
	programStartDate?: string // yyyy-mm-dd
	programTimezone?: string // IANA TZ
	programStartWeek?: number // 1..(18|21) only used on create
	days: Array<{
		dayOfWeek: number
		order?: number
		exercises: Array<{
			exerciseId: string
			order?: number
			restSeconds: number
			progressionScheme: ProgressionScheme
			minWeightIncrement: number
			// RtF-specific
			programTMKg?: number
			programRoundingKg?: number
			// Unified PROGRAMMED_RTF variant indicator per exercise
			programStyle?: ProgramStyle
			sets: Array<
				| {
						setNumber: number
						repType: 'FIXED'
						reps: number
						weight?: number
						rir?: number | null
				  }
				| {
						setNumber: number
						repType: 'RANGE'
						minReps: number
						maxReps: number
						weight?: number
						rir?: number | null
				  }
			>
		}>
	}>
	programStyle?: ProgramStyle
}
