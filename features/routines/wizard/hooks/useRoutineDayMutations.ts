import { useCallback } from 'react'
import type { RoutineWizardData, ProgressionScheme } from '../types'

interface UseRoutineDayMutationsParams {
	data: RoutineWizardData
	onUpdate: (updates: Partial<RoutineWizardData>) => void
	selectedDayIndex: number
	trainingDays: number[]
	canUseTimeframe: boolean
}

const MIN_REPS = 1
const MAX_REPS = 50
const MIN_WEIGHT_INCREMENT = 0.25
const MAX_WEIGHT = 500
const WEIGHT_STEP = 0.5
const ALLOWED_ROUNDING = [0.5, 1, 2.5, 5] as const

const clamp = (value: number, min: number, max: number) => {
	if (Number.isNaN(value)) return min
	return Math.min(max, Math.max(min, value))
}

const roundToIncrement = (value: number, increment: number) =>
	Math.round(value / increment) * increment

/**
 * Provide mutation helpers to modify the selected day's routine data.
 *
 * The hook locates the currently selected training day in `data.days` and exposes functions
 * to add/remove exercises and sets, update progression, reps, weights, rest, and related program
 * fields. When a mutation is applied the hook calls `onUpdate` with an updated `days` array.
 * If the selected day is not present, mutations are no-ops and no update is emitted.
 *
 * @param data - The routine wizard state containing `days` to mutate
 * @param onUpdate - Callback invoked with partial updates to the routine data (e.g., `{ days: [...] }`)
 * @param selectedDayIndex - Index into `trainingDays` indicating the currently selected target day
 * @param trainingDays - Array of day-of-week identifiers used to find the corresponding entry in `data.days`
 * @param canUseTimeframe - Whether time-based progression schemes are allowed
 * @returns An object of mutation helpers:
 * - addExercise(exerciseId): adds an exercise to the selected day and returns the new exercise index or null
 * - removeExercise(exerciseIndex): removes an exercise from the selected day
 * - updateProgramTMKg(exerciseIndex, tmKg): sets an exercise's program TM (rounded and clamped)
 * - updateProgramRoundingKg(exerciseIndex, roundingKg): sets program rounding (validated against allowed values)
 * - updateProgressionScheme(exerciseIndex, scheme): updates an exercise's progression scheme (respects timeframe)
 * - updateMinWeightIncrement(exerciseIndex, increment): updates an exercise's minimum weight increment (clamped)
 * - addSet(exerciseIndex): appends a set to an exercise
 * - removeSet(exerciseIndex, setIndex): removes a set and renumbers remaining sets
 * - stepFixedReps(exerciseIndex, setIndex, delta): adjusts fixed reps by `delta` (clamped)
 * - stepRangeReps(exerciseIndex, setIndex, field, delta): adjusts min/max reps by `delta` (keeps min/max consistent)
 * - stepWeight(exerciseIndex, setIndex, delta): adjusts a set's weight by `delta * WEIGHT_STEP` (rounded, >= 0)
 * - updateSet(exerciseIndex, setIndex, field, value): updates a specific set field (`repType`, `reps`, `minReps`, `maxReps`, `weight`)
 * - validateMinMaxReps(exerciseIndex, setIndex, field): ensures min/max reps are not inverted
 * - setRestSeconds(exerciseIndex, restSeconds): sets rest seconds for an exercise
 */
export function useRoutineDayMutations({
	data,
	onUpdate,
	selectedDayIndex,
	trainingDays,
	canUseTimeframe,
}: UseRoutineDayMutationsParams) {
	const getDayIndex = useCallback(() => {
		if (selectedDayIndex >= trainingDays.length) return -1
		const targetDay = trainingDays[selectedDayIndex]
		return data.days.findIndex((day) => day.dayOfWeek === targetDay)
	}, [data.days, trainingDays, selectedDayIndex])

	const withDayMutation = useCallback(
		<Result = void>(mutator: (day: RoutineWizardData['days'][number]) => Result) => {
			const dayIndex = getDayIndex()
			if (dayIndex === -1) return null

			const originalDay = data.days[dayIndex]
			const clonedDay = {
				...originalDay,
				exercises: originalDay.exercises.map((exercise) => ({
					...exercise,
					sets: exercise.sets.map((set) => ({ ...set })),
				})),
			}

			const newDays = [...data.days]
			newDays[dayIndex] = clonedDay

			const result = mutator(clonedDay)
			onUpdate({ days: newDays })
			return { result, dayIndex }
		},
		[data.days, getDayIndex, onUpdate],
	)

	const addExercise = useCallback(
		(exerciseId: string) =>
			withDayMutation((day) => {
				const newExercise: RoutineWizardData['days'][number]['exercises'][number] = {
					exerciseId,
					progressionScheme: 'NONE',
					minWeightIncrement: 2.5,
					restSeconds: 120,
					sets: [
						{
							setNumber: 1,
							repType: 'FIXED',
							reps: 10,
							weight: undefined,
						},
					],
				}

				day.exercises.push(newExercise)
				return day.exercises.length - 1
			})?.result ?? null,
		[withDayMutation],
	)

	const removeExercise = useCallback(
		(exerciseIndex: number) => {
			withDayMutation((day) => {
				day.exercises.splice(exerciseIndex, 1)
			})
		},
		[withDayMutation],
	)

	const updateProgramTMKg = useCallback(
		(exerciseIndex: number, tmKg: number) => {
			withDayMutation((day) => {
				const exercise = day.exercises[exerciseIndex]
				if (!exercise) return
				const rounded = roundToIncrement(clamp(tmKg, 0, MAX_WEIGHT), WEIGHT_STEP)
				exercise.programTMKg = Number.isNaN(rounded) ? undefined : rounded
			})
		},
		[withDayMutation],
	)

	const updateProgramRoundingKg = useCallback(
		(exerciseIndex: number, roundingKg: number) => {
			withDayMutation((day) => {
				const exercise = day.exercises[exerciseIndex]
				if (!exercise) return
				const valid = ALLOWED_ROUNDING.includes(roundingKg as typeof ALLOWED_ROUNDING[number])
				exercise.programRoundingKg = valid ? roundingKg : 2.5
			})
		},
		[withDayMutation],
	)

	const updateMinWeightIncrement = useCallback(
		(exerciseIndex: number, increment: number) => {
			withDayMutation((day) => {
				const exercise = day.exercises[exerciseIndex]
				if (!exercise) return
				exercise.minWeightIncrement = clamp(increment, MIN_WEIGHT_INCREMENT, MAX_WEIGHT)
			})
		},
		[withDayMutation],
	)

	const syncDoubleProgressionWeights = (
		exercise: RoutineWizardData['days'][number]['exercises'][number],
		weight: number | null | undefined,
	) => {
		if (exercise.progressionScheme !== 'DOUBLE_PROGRESSION') return
		if (typeof weight === 'undefined') return
		exercise.sets.forEach((set, index) => {
			if (index === 0) return
			set.weight = weight ?? null
		})
	}

	const updateProgressionScheme = useCallback(
		(exerciseIndex: number, scheme: ProgressionScheme) => {
			const isTimeBased = scheme === 'PROGRAMMED_RTF' || scheme === 'PROGRAMMED_RTF_HYPERTROPHY'
			if (isTimeBased && !canUseTimeframe) return

			withDayMutation((day) => {
				const exercise = day.exercises[exerciseIndex]
				if (!exercise) return

				exercise.progressionScheme = scheme

				if (scheme !== 'NONE') {
					exercise.sets.forEach((set) => {
						if (set.repType === 'FIXED') {
							const base = set.reps ?? set.minReps ?? set.maxReps ?? 8
							set.repType = 'RANGE'
							const min = clamp(base, MIN_REPS, MAX_REPS)
							set.minReps = min
							set.maxReps = clamp(base, min, MAX_REPS)
							set.reps = null
						}
					})
				}

				if (scheme === 'DOUBLE_PROGRESSION' && exercise.sets.length > 0) {
					syncDoubleProgressionWeights(exercise, exercise.sets[0].weight)
				}

				if (isTimeBased && typeof exercise.programRoundingKg === 'undefined') {
					exercise.programRoundingKg = 2.5
				}
			})
		},
		[canUseTimeframe, withDayMutation],
	)

	const addSet = useCallback(
		(exerciseIndex: number) => {
			withDayMutation((day) => {
				const exercise = day.exercises[exerciseIndex]
				if (!exercise) return
				if (exercise.progressionScheme === 'PROGRAMMED_RTF') return

				const lastSet = exercise.sets[exercise.sets.length - 1]
				const newSetNumber = exercise.sets.length + 1
				const newSet = {
					setNumber: newSetNumber,
					repType: lastSet?.repType ?? 'FIXED',
					reps: lastSet?.repType === 'FIXED' ? lastSet?.reps ?? 10 : null,
					minReps: lastSet?.repType === 'RANGE' ? lastSet?.minReps ?? 8 : null,
					maxReps: lastSet?.repType === 'RANGE' ? lastSet?.maxReps ?? 12 : null,
					weight: lastSet?.weight,
				}

				if (exercise.progressionScheme === 'DOUBLE_PROGRESSION' && exercise.sets.length > 0) {
					newSet.weight = exercise.sets[0].weight
				}

				exercise.sets.push(newSet)
			})
		},
		[withDayMutation],
	)

	const removeSet = useCallback(
		(exerciseIndex: number, setIndex: number) => {
			withDayMutation((day) => {
				const exercise = day.exercises[exerciseIndex]
				if (!exercise) return
				exercise.sets.splice(setIndex, 1)
				exercise.sets.forEach((set, index) => {
					set.setNumber = index + 1
				})
			})
		},
		[withDayMutation],
	)

	const stepFixedReps = useCallback(
		(exerciseIndex: number, setIndex: number, delta: number) => {
			withDayMutation((day) => {
				const exercise = day.exercises[exerciseIndex]
				const set = exercise?.sets[setIndex]
				if (!set) return
				const current = set.reps ?? MIN_REPS
				set.reps = clamp(current + delta, MIN_REPS, MAX_REPS)
			})
		},
		[withDayMutation],
	)

	const stepRangeReps = useCallback(
		(
			exerciseIndex: number,
			setIndex: number,
			field: 'minReps' | 'maxReps',
			delta: number,
		) => {
			withDayMutation((day) => {
				const exercise = day.exercises[exerciseIndex]
				const set = exercise?.sets[setIndex]
				if (!set) return

				if (field === 'minReps') {
					const current = set.minReps ?? MIN_REPS
					const next = clamp(current + delta, MIN_REPS, MAX_REPS)
					set.minReps = next
					if (typeof set.maxReps === 'number' && set.maxReps < next) {
						set.maxReps = next
					}
				} else {
					const current = set.maxReps ?? set.minReps ?? MIN_REPS
					const next = clamp(current + delta, MIN_REPS, MAX_REPS)
					set.maxReps = next
					if (typeof set.minReps === 'number' && set.minReps > next) {
						set.minReps = next
					}
				}
			})
		},
		[withDayMutation],
	)

	const stepWeight = useCallback(
		(exerciseIndex: number, setIndex: number, delta: number) => {
			withDayMutation((day) => {
				const exercise = day.exercises[exerciseIndex]
				const set = exercise?.sets[setIndex]
				if (!exercise || !set) return

				const current = set.weight ?? 0
				const next = Math.max(0, roundToIncrement(current + delta * WEIGHT_STEP, WEIGHT_STEP))
				set.weight = next
				syncDoubleProgressionWeights(exercise, setIndex === 0 ? next : exercise.sets[0]?.weight)
			})
		},
		[withDayMutation],
	)

	const validateMinMaxReps = useCallback(
		(exerciseIndex: number, setIndex: number, field: 'minReps' | 'maxReps') => {
			withDayMutation((day) => {
				const exercise = day.exercises[exerciseIndex]
				const set = exercise?.sets[setIndex]
				if (!set) return

				if (field === 'minReps') {
					if (
						typeof set.maxReps === 'number' &&
						typeof set.minReps === 'number' &&
						set.minReps > set.maxReps
					) {
						set.maxReps = set.minReps
					}
				} else if (field === 'maxReps') {
					if (
						typeof set.minReps === 'number' &&
						typeof set.maxReps === 'number' &&
						set.maxReps < set.minReps
					) {
						set.minReps = set.maxReps
					}
				}
			})
		},
		[withDayMutation],
	)

	const updateSet = useCallback(
		(
			exerciseIndex: number,
			setIndex: number,
			field: 'repType' | 'reps' | 'minReps' | 'maxReps' | 'weight',
			value: string,
		) => {
			withDayMutation((day) => {
				const exercise = day.exercises[exerciseIndex]
				const set = exercise?.sets[setIndex]
				if (!exercise || !set) return

				if (field === 'repType') {
					const nextType = value as 'FIXED' | 'RANGE'
					set.repType = nextType
					if (nextType === 'FIXED') {
						set.reps = set.reps ?? set.minReps ?? 10
						set.minReps = null
						set.maxReps = null
					} else {
						const fallback = set.reps ?? 10
						const min = clamp(fallback - 2, MIN_REPS, MAX_REPS)
						set.minReps = set.minReps ?? min
						set.maxReps = set.maxReps ?? clamp(fallback + 2, min, MAX_REPS)
						set.reps = null
					}
				} else if (field === 'weight') {
					if (value === '') {
						set.weight = undefined
					} else {
						const parsed = parseFloat(value)
						set.weight = Number.isNaN(parsed) ? undefined : Math.max(0, parsed)
					}
					syncDoubleProgressionWeights(exercise, value === '' ? undefined : set.weight)
				} else {
					const parsed = value === '' ? null : parseInt(value, 10)
					if (field === 'reps') {
						set.reps = parsed === null ? null : clamp(parsed, MIN_REPS, MAX_REPS)
					} else if (field === 'minReps') {
						set.minReps = parsed === null ? null : clamp(parsed, MIN_REPS, MAX_REPS)
					} else if (field === 'maxReps') {
						set.maxReps = parsed === null ? null : clamp(parsed, MIN_REPS, MAX_REPS)
					}
				}
			})
		},
		[withDayMutation],
	)

	const setRestSeconds = useCallback(
		(exerciseIndex: number, restSeconds: number) => {
			withDayMutation((day) => {
				const exercise = day.exercises[exerciseIndex]
				if (!exercise) return
				exercise.restSeconds = restSeconds
			})
		},
		[withDayMutation],
	)

	return {
		addExercise,
		removeExercise,
		updateProgramTMKg,
		updateProgramRoundingKg,
		updateProgressionScheme,
		updateMinWeightIncrement,
		addSet,
		removeSet,
		stepFixedReps,
		stepRangeReps,
		stepWeight,
		updateSet,
		validateMinMaxReps,
		setRestSeconds,
	}
}
