import type { Routine, RoutineExercise } from '@/lib/api/types/routine.type'
import type { SetLog } from '@/lib/api/types/workout.type'

import type {
	ExerciseCompletionData,
	GroupedExerciseLogs,
	SessionProgressData,
} from './workout-session.types'

/** LIVE-15: an exercise takes at most this many sets beyond its prescription. */
export const MAX_EXTRA_SETS = 10

const prescribedSetCount = (exercise: RoutineExercise) =>
	exercise.sets.reduce((max, set) => Math.max(max, set.setNumber), 0)

/**
 * LIVE-15: the sets logged beyond an exercise's prescription, in order. They
 * are work done today -- counted wherever completed work counts -- but they
 * have no target and progression never reads them.
 */
export const extraSetLogs = (
	setLogs: SetLog[] | undefined,
	exercise: RoutineExercise,
): SetLog[] => {
	const prescribed = prescribedSetCount(exercise)
	return (setLogs ?? [])
		.filter(
			l => l.routineExerciseId === exercise.id && l.setNumber > prescribed,
		)
		.sort((a, b) => a.setNumber - b.setNumber)
}

/** Every set of an exercise in this session: its prescription, then its extras. */
const sessionSetNumbers = (
	setLogs: SetLog[] | undefined,
	exercise: RoutineExercise,
) => [
	...exercise.sets.map(set => set.setNumber),
	...extraSetLogs(setLogs, exercise).map(log => log.setNumber),
]

/**
 * Calculates overall session progress based on set logs and exercises
 * @param setLogs - Array of set logs from the session
 * @param exercises - Array of routine exercises
 * @returns Session progress data with totals and percentage
 */
export const calculateSessionProgress = (
	setLogs: SetLog[],
	exercises: RoutineExercise[],
): SessionProgressData => {
	if (!exercises || exercises.length === 0) {
		return { totalSets: 0, completedSets: 0, percentage: 0 }
	}

	const totalSets = exercises.reduce(
		(acc, re) => acc + sessionSetNumbers(setLogs, re).length,
		0,
	)

	if (!setLogs || setLogs.length === 0) {
		return { totalSets, completedSets: 0, percentage: 0 }
	}

	const completedKeys = new Set(
		setLogs
			.filter(l => l.isCompleted)
			.map(l => `${l.routineExerciseId}-${l.setNumber}`),
	)

	const completedSets = exercises.reduce(
		(acc, re) =>
			acc +
			sessionSetNumbers(setLogs, re).filter(n =>
				completedKeys.has(`${re.id}-${n}`),
			).length,
		0,
	)

	const percentage =
		totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0

	return { totalSets, completedSets, percentage }
}

/**
 * Calculates completion data for a specific exercise
 * @param setLogs - Array of set logs from the session
 * @param exercise - The routine exercise
 * @returns Exercise completion data
 */
export const calculateExerciseCompletion = (
	setLogs: SetLog[],
	exercise: RoutineExercise,
): ExerciseCompletionData => {
	const setNumbers = sessionSetNumbers(setLogs, exercise)
	const completedSets = setNumbers.filter(setNumber => {
		const log = setLogs.find(
			l => l.routineExerciseId === exercise.id && l.setNumber === setNumber,
		)
		return log?.isCompleted
	}).length

	const totalSets = setNumbers.length
	const isCompleted = totalSets > 0 && completedSets === totalSets
	const percentage =
		totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0

	return {
		exerciseId: exercise.id,
		completedSets,
		totalSets,
		percentage,
		isCompleted,
	}
}

/**
 * Checks if all sets in the routine day are completed
 * Overloaded to support both test signature and original signature
 */
export function areAllSetsCompleted(
	setLogs: SetLog[],
	exercises: RoutineExercise[],
): boolean
export function areAllSetsCompleted(
	routine: Routine | undefined,
	routineDayId: string,
	setLogs: SetLog[] | undefined,
): boolean
export function areAllSetsCompleted(
	routineOrSetLogs: Routine | undefined | SetLog[],
	routineDayIdOrExercises: string | RoutineExercise[],
	setLogs?: SetLog[],
): boolean {
	// Handle the overloaded case (setLogs, exercises)
	if (
		Array.isArray(routineOrSetLogs) &&
		Array.isArray(routineDayIdOrExercises)
	) {
		const logs = routineOrSetLogs as SetLog[]
		const exercises = routineDayIdOrExercises as RoutineExercise[]

		// If no exercises, return true (vacuous truth)
		if (exercises.length === 0) return true

		// If no set logs but there are exercises, return false
		if (logs.length === 0) return false

		const completedSetLogs = new Set(
			logs
				.filter(l => l.isCompleted)
				.map(l => `${l.routineExerciseId}-${l.setNumber}`),
		)

		return exercises.every(re =>
			sessionSetNumbers(logs, re).every(n =>
				completedSetLogs.has(`${re.id}-${n}`),
			),
		)
	}

	// Handle the original case (routine, routineDayId, setLogs)
	const routine = routineOrSetLogs as Routine | undefined
	const routineDayId = routineDayIdOrExercises as string
	const logs = setLogs as SetLog[] | undefined

	if (!routine || !logs) return false

	const day = routine.days.find(d => d.id === routineDayId)
	if (!day) return false

	const completedSetLogs = new Set(
		logs
			.filter(l => l.isCompleted)
			.map(l => `${l.routineExerciseId}-${l.setNumber}`),
	)

	return day.exercises.every(re =>
		sessionSetNumbers(logs, re).every(n =>
			completedSetLogs.has(`${re.id}-${n}`),
		),
	)
}

/**
 * Group set logs by exercise for display
 */
export function groupSetLogsByExercise(
	setLogs: SetLog[],
	exercises: RoutineExercise[],
	sessionId: string,
): GroupedExerciseLogs[] {
	const sortedExercises = [...exercises].sort((a, b) => a.order - b.order)

	return sortedExercises.map(re => {
		const templateSets = [...re.sets].sort((a, b) => a.setNumber - b.setNumber)

		const sets = templateSets.map(tpl => {
			const log = setLogs.find(
				l => l.routineExerciseId === re.id && l.setNumber === tpl.setNumber,
			)

			return {
				id: log?.id ?? `${re.id}-${tpl.setNumber}`,
				sessionId,
				routineExerciseId: re.id,
				exerciseId: re.exercise.id,
				setNumber: tpl.setNumber,
				reps: log?.reps ?? 0,
				weight: log?.weight ?? tpl.weight,
				// Carried through so a logged RPE survives a refetch. The contract
				// types this as `number | null`; the grouped set uses `undefined`.
				rpe: log?.rpe ?? undefined,
				isCompleted: log?.isCompleted ?? false,
				plannedReps: tpl.reps,
				plannedMinReps: tpl.minReps,
				plannedMaxReps: tpl.maxReps,
				plannedWeight: tpl.weight,
				plannedRir: tpl.rir,
				isExtra: false,
			}
		})

		const extras = extraSetLogs(setLogs, re).map(log => ({
			id: log.id,
			sessionId,
			routineExerciseId: re.id,
			exerciseId: re.exercise.id,
			setNumber: log.setNumber,
			reps: log.reps ?? 0,
			weight: log.weight ?? undefined,
			rpe: log.rpe ?? undefined,
			isCompleted: log.isCompleted,
			plannedReps: null,
			plannedMinReps: null,
			plannedMaxReps: null,
			plannedWeight: null,
			plannedRir: null,
			isExtra: true,
		}))

		return {
			exerciseId: re.id,
			exerciseName: re.exercise.name,
			sets: [...sets, ...extras],
			progressionScheme: re.progressionScheme,
			restSeconds: re.restSeconds,
			note: re.note,
		} as GroupedExerciseLogs
	})
}
