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
const MIN_RIR = 0
const MAX_RIR = 10
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

const makeClientId = () =>
	globalThis.crypto?.randomUUID?.() ??
	`${Date.now()}-${Math.random().toString(16).slice(2)}`

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
		return data.days.findIndex(day => day.dayOfWeek === targetDay)
	}, [data.days, trainingDays, selectedDayIndex])

	const withDayMutation = useCallback(
		<Result = void>(
			mutator: (day: RoutineWizardData['days'][number]) => Result,
		) => {
			const dayIndex = getDayIndex()
			if (dayIndex === -1) return null

			const originalDay = data.days[dayIndex]
			const clonedDay = {
				...originalDay,
				exercises: originalDay.exercises.map(exercise => ({
					...exercise,
					sets: exercise.sets.map(set => ({ ...set })),
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
			withDayMutation(day => {
				const newExercise: RoutineWizardData['days'][number]['exercises'][number] =
					{
						clientId: makeClientId(),
						exerciseId,
						progressionScheme: 'NONE',
						minWeightIncrement: 2.5,
						restSeconds: 180,
						sets: [
							{
								setNumber: 1,
								repType: 'FIXED',
								reps: 10,
								weight: undefined,
								rir: null,
							},
						],
					}

				day.exercises.push(newExercise)
				return newExercise.clientId ?? null
			})?.result ?? null,
		[withDayMutation],
	)

	const removeExercise = useCallback(
		(exerciseIndex: number) => {
			withDayMutation(day => {
				day.exercises.splice(exerciseIndex, 1)
			})
		},
		[withDayMutation],
	)

	const updateExercise = useCallback(
		(exerciseIndex: number, newExerciseId: string) => {
			withDayMutation(day => {
				const exercise = day.exercises[exerciseIndex]
				if (!exercise) return
				// Only update the exerciseId, preserve all other configuration
				exercise.exerciseId = newExerciseId
			})
		},
		[withDayMutation],
	)

	const updateExerciseNote = useCallback(
		(exerciseIndex: number, note: string) => {
			withDayMutation(day => {
				const exercise = day.exercises[exerciseIndex]
				if (!exercise) return
				exercise.note = note
			})
		},
		[withDayMutation],
	)

	const updateProgramTMKg = useCallback(
		(exerciseIndex: number, tmKg: number) => {
			withDayMutation(day => {
				const exercise = day.exercises[exerciseIndex]
				if (!exercise) return
				const rounded = roundToIncrement(
					clamp(tmKg, 0, MAX_WEIGHT),
					WEIGHT_STEP,
				)
				exercise.programTMKg = Number.isNaN(rounded) ? undefined : rounded
			})
		},
		[withDayMutation],
	)

	const updateProgramRoundingKg = useCallback(
		(exerciseIndex: number, roundingKg: number) => {
			withDayMutation(day => {
				const exercise = day.exercises[exerciseIndex]
				if (!exercise) return
				const valid = ALLOWED_ROUNDING.includes(
					roundingKg as (typeof ALLOWED_ROUNDING)[number],
				)
				exercise.programRoundingKg = valid ? roundingKg : 2.5
			})
		},
		[withDayMutation],
	)

	const updateMinWeightIncrement = useCallback(
		(exerciseIndex: number, increment: number) => {
			withDayMutation(day => {
				const exercise = day.exercises[exerciseIndex]
				if (!exercise) return
				exercise.minWeightIncrement = clamp(
					increment,
					MIN_WEIGHT_INCREMENT,
					MAX_WEIGHT,
				)
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
			const isTimeBased =
				scheme === 'PROGRAMMED_RTF' || scheme === 'PROGRAMMED_RTF_HYPERTROPHY'
			if (isTimeBased && !canUseTimeframe) return

			withDayMutation(day => {
				const exercise = day.exercises[exerciseIndex]
				if (!exercise) return

				exercise.progressionScheme = scheme

				if (scheme !== 'NONE') {
					exercise.sets.forEach(set => {
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
			withDayMutation(day => {
				const exercise = day.exercises[exerciseIndex]
				if (!exercise) return
				if (exercise.progressionScheme === 'PROGRAMMED_RTF') return

				const lastSet = exercise.sets[exercise.sets.length - 1]
				const newSetNumber = exercise.sets.length + 1
				const newSet = {
					setNumber: newSetNumber,
					repType: lastSet?.repType ?? 'FIXED',
					reps: lastSet?.repType === 'FIXED' ? (lastSet?.reps ?? 10) : null,
					minReps:
						lastSet?.repType === 'RANGE' ? (lastSet?.minReps ?? 8) : null,
					maxReps:
						lastSet?.repType === 'RANGE' ? (lastSet?.maxReps ?? 12) : null,
					weight: lastSet?.weight,
					rir: lastSet?.rir ?? null,
				}

				if (
					exercise.progressionScheme === 'DOUBLE_PROGRESSION' &&
					exercise.sets.length > 0
				) {
					newSet.weight = exercise.sets[0].weight
				}

				exercise.sets.push(newSet)
			})
		},
		[withDayMutation],
	)

	const removeSet = useCallback(
		(exerciseIndex: number, setIndex: number) => {
			withDayMutation(day => {
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
			withDayMutation(day => {
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
			withDayMutation(day => {
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
			withDayMutation(day => {
				const exercise = day.exercises[exerciseIndex]
				const set = exercise?.sets[setIndex]
				if (!exercise || !set) return

				const current = set.weight ?? 0
				const next = Math.max(
					0,
					roundToIncrement(current + delta * WEIGHT_STEP, WEIGHT_STEP),
				)
				set.weight = next
				syncDoubleProgressionWeights(
					exercise,
					setIndex === 0 ? next : exercise.sets[0]?.weight,
				)
			})
		},
		[withDayMutation],
	)

	const validateMinMaxReps = useCallback(
		(exerciseIndex: number, setIndex: number, field: 'minReps' | 'maxReps') => {
			withDayMutation(day => {
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
			field: 'repType' | 'reps' | 'minReps' | 'maxReps' | 'weight' | 'rir',
			value: string | number | null,
		) => {
			withDayMutation(day => {
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
					if (value === '' || value === null) {
						set.weight = undefined
					} else {
						const parsed = parseFloat(String(value))
						set.weight = Number.isNaN(parsed) ? undefined : Math.max(0, parsed)
					}
					syncDoubleProgressionWeights(
						exercise,
						value === '' ? undefined : set.weight,
					)
				} else if (field === 'rir') {
					if (value === null || value === '') {
						set.rir = null
						return
					}
					const parsed = typeof value === 'number' ? value : parseInt(value, 10)
					set.rir = Number.isNaN(parsed)
						? null
						: clamp(parsed, MIN_RIR, MAX_RIR)
				} else {
					const parsed =
						value === '' || value === null ? null : parseInt(String(value), 10)
					if (field === 'reps') {
						set.reps =
							parsed === null ? null : clamp(parsed, MIN_REPS, MAX_REPS)
					} else if (field === 'minReps') {
						set.minReps =
							parsed === null ? null : clamp(parsed, MIN_REPS, MAX_REPS)
					} else if (field === 'maxReps') {
						set.maxReps =
							parsed === null ? null : clamp(parsed, MIN_REPS, MAX_REPS)
					}
				}
			})
		},
		[withDayMutation],
	)

	const setRestSeconds = useCallback(
		(exerciseIndex: number, restSeconds: number) => {
			withDayMutation(day => {
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
		updateExercise,
		updateExerciseNote,
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
