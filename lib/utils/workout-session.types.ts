import type { LinearPeriodizationState, SetKind } from '@sunsteel/contracts'

import type { ProgressionScheme } from '@/lib/api/types/routine.shared'
import type { Routine } from '@/lib/api/types/routine.type'

export type UpsertSetLogPayload = {
	routineExerciseId: string
	exerciseId: string
	setNumber: number
	reps: number
	weight?: number
	rpe?: number
	isCompleted?: boolean
	/** LIVE-12: changes the set's kind; omitted, it keeps its own. */
	kind?: SetKind
}

export type LogRowProps = {
	sessionId: string
	routineExerciseId: string
	exerciseId: string
	setNumber: number
	reps: number
	weight?: number
	rpe?: number
	isCompleted: boolean
	plannedReps?: number | null
	plannedMinReps?: number | null
	plannedMaxReps?: number | null
	plannedWeight?: number | null
	plannedRir?: number | null
	onSave: (payload: UpsertSetLogPayload) => void
	/** Fired only when a set is ticked complete, never when it is unticked. */
	onSetCompleted?: () => void
}

export type GroupedLogsProps = {
	logs: Array<{
		id: string
		routineExerciseId: string
		exerciseId: string
		setNumber: number
		reps: number
		weight?: number
		rpe?: number
		isCompleted: boolean
	}>
	routineId: string
	routineDayId: string
	routine: Routine
	sessionId: string
	onSave: LogRowProps['onSave']
}

export type SessionStatus = 'COMPLETED' | 'ABORTED'

export type SessionProgressData = {
	totalSets: number
	completedSets: number
	percentage: number
}

export type ExerciseCompletionData = {
	exerciseId: string
	completedSets: number
	totalSets: number
	percentage: number
	isCompleted: boolean
}

// Grouped exercise logs used by the Active Session page
export type GroupedExerciseLogs = {
	exerciseId: string
	exerciseName: string
	sets: Array<{
		id: string
		sessionId: string
		routineExerciseId: string
		exerciseId: string
		setNumber: number
		reps: number
		weight?: number
		rpe?: number
		isCompleted: boolean
		plannedReps?: number | null
		plannedMinReps?: number | null
		plannedMaxReps?: number | null
		plannedWeight?: number | null
		plannedRir?: number | null
		/** LIVE-15: logged beyond the prescription, so it has no target. */
		isExtra?: boolean
		/** LIVE-12: what the set is for in this workout. */
		kind: SetKind
		/**
		 * ROUT-17: the set's 0-based place among the prescription's working
		 * (non-warm-up) sets, which picks its target in an 8-week block; null
		 * for a warm-up and for an extra set.
		 */
		workingIndex: number | null
		/**
		 * LIVE-22 (§27.3): the weight is the prescription's, not one the member
		 * logged, so the row shows it as a suggestion until it is edited or the
		 * set is ticked.
		 */
		weightIsSuggestion: boolean
	}>
	progressionScheme: ProgressionScheme
	/**
	 * ROUT-17: the 8-week block this slot trains in this workout -- an LP slot,
	 * not swapped, with a reference max -- as it stood when the workout
	 * started; null otherwise.
	 */
	linearPeriodization: LinearPeriodizationState | null
	/** ROUT-17: an LP slot without a reference max, trained as a normal exercise. */
	linearBlockUnset: boolean
	// LIVE-01 reads this to start the rest countdown.
	restSeconds: number
	note?: string | null
}
