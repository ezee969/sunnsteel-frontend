import type {
	RoutineScheduleMode,
	TrainingExperienceLevel,
	TrainingGoal,
} from '@sunsteel/contracts'

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
	/** The weekday (0=Sun..6=Sat) on a weekly routine; the position on a rotation. */
	slot: number
	/** Optional day name (ROUT-11); blank means none. */
	name?: string
	exercises: RoutineWizardExercise[]
}

export interface RoutineWizardData {
	name: string
	description?: string
	/**
	 * ROUT-07: what the author says this programme is for. Both optional and
	 * both undeclared by default -- discovery never guesses them from the
	 * author's own training identity.
	 */
	goal?: TrainingGoal | null
	experienceLevel?: TrainingExperienceLevel | null
	scheduleMode: RoutineScheduleMode
	/** The days' slots in display order. */
	trainingDays: number[]
	/** SCHED-07: weekdays a weekly routine rests on by plan; none on a rotation. */
	restDays: number[]
	/** SCHED-06: weekdays a rotation trains on; none means any day. */
	rotationWeekdays: number[]
	days: RoutineWizardDay[]
}
