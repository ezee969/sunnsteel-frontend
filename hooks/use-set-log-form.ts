import type { SetKind, WeightUnit } from '@sunsteel/contracts'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useDebounce } from '@/hooks/use-debounce'
import { markSetPending } from '@/lib/api/hooks/useWorkoutSession'
import { DEBOUNCE_DELAYS } from '@/lib/constants/session.constants'
import { useSaveState } from '@/lib/utils/save-status-store'
import {
	missingForCompletion,
	type SetLogValidationField,
	validateSetLogPayload,
} from '@/lib/utils/session-validation.utils'
import {
	areCanonicalWeightsEqual,
	formatWeightInput,
	parseWeightInput,
} from '@/lib/utils/weight-unit'
import type { UpsertSetLogPayload } from '@/lib/utils/workout-session.types'

/** The values a set row can be filled from (LIVE-15). */
export interface SetValues {
	reps: number
	weight?: number | null
	rpe?: number | null
}

interface UseSetLogFormProps {
	sessionId: string
	routineExerciseId: string
	exerciseId: string
	setNumber: number
	initialReps: number
	initialWeight?: number
	initialRpe?: number
	initialIsCompleted: boolean
	weightUnit: WeightUnit
	/**
	 * ROUT-17: the load an 8-week block prescribes, kg. Set, the row's weight
	 * is fixed: it cannot be typed, and every save sends exactly this value.
	 */
	fixedWeightKg?: number
	/**
	 * LIVE-22 (§27.3): the prescription's weight, kg, shown as a suggestion
	 * while the field is empty. Ticking with the field untouched logs it, so
	 * one-tap logging stays.
	 */
	suggestedWeightKg?: number | null
	onSave: (payload: UpsertSetLogPayload) => void
	/**
	 * Fired when a set is ticked. LIVE-22: `viaKeyboard` says the tick came
	 * from the keyboard, so the screen may move focus on to the next set.
	 */
	onSetCompleted?: (viaKeyboard: boolean) => void
}

interface UseSetLogFormReturn {
	// Form state
	repsState: string
	weightState: string
	rpeState: string
	isCompletedState: boolean

	// Save state
	saveState: 'idle' | 'pending' | 'saving' | 'saved' | 'error'

	// Form handlers
	setReps: (value: string) => void
	setWeight: (value: string) => void
	setRpe: (value: string) => void
	/**
	 * Ticks or unticks the set. LIVE-21: a tick with a field still empty is
	 * refused and returns that field, so the row can point at it.
	 */
	handleCompletionToggle: (
		checked: boolean,
		viaKeyboard?: boolean,
	) => 'reps' | 'weight' | null
	/** LIVE-15: put another set's values in the fields and save them. */
	fill: (values: SetValues) => void
	/** LIVE-12: change what the set is for, saved at once with its values. */
	changeKind: (kind: SetKind) => void

	// Validation
	isValid: boolean
	validationError?: string
	validationField?: SetLogValidationField
	/**
	 * LIVE-21: the field the set needs before it can be (or stay) ticked, shown
	 * once a tick was refused, or while a ticked set has a field emptied.
	 */
	completionField: 'reps' | 'weight' | null
}

/**
 * Custom hook for managing set log form state, validation, and auto-save functionality
 */
export const useSetLogForm = ({
	sessionId,
	routineExerciseId,
	exerciseId,
	setNumber,
	initialReps,
	initialWeight,
	initialRpe,
	initialIsCompleted,
	weightUnit,
	fixedWeightKg,
	suggestedWeightKg,
	onSave,
	onSetCompleted,
}: UseSetLogFormProps): UseSetLogFormReturn => {
	const t = useTranslations('core.setLogValidation')
	// Form state
	const [repsState, setRepsState] = useState<string>(
		initialReps > 0 ? String(initialReps) : '',
	)
	const [weightState, setWeightState] = useState<string>(
		formatWeightInput(fixedWeightKg ?? initialWeight, weightUnit),
	)
	// ROUT-17: a fixed load is read from the prescription, never from the
	// field, so a pound value rounded for display never converts back as a
	// different load.
	const weightOf = useCallback(
		(value: string) => fixedWeightKg ?? parseWeightInput(value, weightUnit),
		[fixedWeightKg, weightUnit],
	)
	const weightUnitRef = useRef(weightUnit)
	const isWeightUnitTransition = weightUnitRef.current !== weightUnit
	const [rpeState, setRpeState] = useState<string>(
		initialRpe !== undefined && initialRpe !== null ? String(initialRpe) : '',
	)
	const [isCompletedState, setIsCompletedState] = useState<boolean>(
		initialIsCompleted ?? false,
	)
	// LIVE-21: a tick was refused for an empty field; cleared by the next tick.
	const [tickRefused, setTickRefused] = useState(false)

	// Debounced values for auto-save
	const debouncedReps = useDebounce(repsState, DEBOUNCE_DELAYS.SET_LOG_SAVE)
	const debouncedWeight = useDebounce(weightState, DEBOUNCE_DELAYS.SET_LOG_SAVE)
	const debouncedRpe = useDebounce(rpeState, DEBOUNCE_DELAYS.SET_LOG_SAVE)

	// Save state tracking
	const saveState = useSaveState(
		`set:${sessionId}:${routineExerciseId}:${setNumber}`,
	)

	// Store latest onSave callback in ref to prevent infinite loop
	const onSaveRef = useRef(onSave)
	useEffect(() => {
		onSaveRef.current = onSave
	}, [onSave])

	const onSetCompletedRef = useRef(onSetCompleted)
	useEffect(() => {
		onSetCompletedRef.current = onSetCompleted
	}, [onSetCompleted])

	useEffect(() => {
		const previousUnit = weightUnitRef.current
		if (previousUnit === weightUnit) return

		const currentWeightKg =
			fixedWeightKg ??
			parseWeightInput(weightState, previousUnit) ??
			initialWeight
		const convertedWeight = formatWeightInput(currentWeightKg, weightUnit)
		setWeightState(convertedWeight)
		weightUnitRef.current = weightUnit
	}, [fixedWeightKg, initialWeight, weightState, weightUnit])

	// Track last saved values to prevent redundant saves
	const lastSavedRef = useRef({
		reps: initialReps,
		weight: fixedWeightKg ?? initialWeight,
		rpe: initialRpe,
		isCompleted: initialIsCompleted,
	})

	// Sync lastSavedRef when initial values change (from external updates/refetch)
	useEffect(() => {
		lastSavedRef.current = {
			reps: initialReps,
			weight: fixedWeightKg ?? initialWeight,
			rpe: initialRpe,
			isCompleted: initialIsCompleted,
		}
	}, [
		initialReps,
		initialWeight,
		fixedWeightKg,
		initialRpe,
		initialIsCompleted,
		setNumber,
	])

	// Create payload for validation and saving
	const createPayload = useCallback(
		(
			reps: string,
			weight: string,
			rpe: string,
			isCompleted: boolean,
		): UpsertSetLogPayload => ({
			routineExerciseId,
			exerciseId,
			setNumber,
			reps: Number(reps) || 0,
			weight: weightOf(weight),
			// An empty box means "not recorded", never RPE 0.
			rpe: rpe === '' ? undefined : Number(rpe),
			isCompleted,
		}),
		[routineExerciseId, exerciseId, setNumber, weightOf],
	)

	// Validate current form state
	const currentPayload = createPayload(
		repsState,
		weightState,
		rpeState,
		isCompletedState,
	)
	const validation = validateSetLogPayload(currentPayload, t)
	// LIVE-22: an empty weight field with a suggestion counts as that weight
	// for a tick, which then writes it into the field. A ticked set never takes
	// it: emptying a done set's weight still holds its save (LIVE-21).
	const suggestionInput =
		!isCompletedState &&
		weightState === '' &&
		suggestedWeightKg != null &&
		fixedWeightKg === undefined
			? formatWeightInput(suggestedWeightKg, weightUnit)
			: null
	const missingField = missingForCompletion({
		reps: repsState,
		weight: weightOf(suggestionInput ?? weightState),
	})
	const completionField = tickRefused || isCompletedState ? missingField : null
	// LIVE-21: a ticked set never stores an empty field; emptying one holds
	// the save until it is filled again.
	const canSave = validation.isValid && !(isCompletedState && missingField)

	// Auto-save effect for debounced values
	useEffect(() => {
		// Wait until every debounced field has caught up with what is typed. A
		// tick saves the live values at once; if this ran with a lagging
		// debounced value it would save that stale value straight after
		// (typing 8 reps and ticking within the delay stored 0 until the
		// debounce caught up, and kept it if the workout finished first).
		if (
			isWeightUnitTransition ||
			debouncedWeight !== weightState ||
			debouncedReps !== repsState ||
			debouncedRpe !== rpeState
		)
			return

		const currentReps = Number(debouncedReps) || 0
		const currentWeight = weightOf(debouncedWeight)
		const currentRpe = debouncedRpe === '' ? undefined : Number(debouncedRpe)

		// Normalize nullish weights for stable comparisons (null === undefined)
		const norm = (w: number | undefined | null) => (w == null ? null : w)
		// Check against last saved values (with normalized nullish weight)
		const hasChanged =
			currentReps !== lastSavedRef.current.reps ||
			!areCanonicalWeightsEqual(currentWeight, lastSavedRef.current.weight) ||
			norm(currentRpe) !== norm(lastSavedRef.current.rpe) ||
			isCompletedState !== lastSavedRef.current.isCompleted

		if (!hasChanged) {
			return
		}

		// Only save if validation passes
		if (canSave) {
			const payload = createPayload(
				debouncedReps,
				debouncedWeight,
				debouncedRpe,
				isCompletedState,
			)
			onSaveRef.current(payload)
			// Update last saved values to prevent redundant saves
			lastSavedRef.current = {
				reps: currentReps,
				weight: currentWeight,
				rpe: currentRpe,
				isCompleted: isCompletedState,
			}
		}
	}, [
		debouncedReps,
		debouncedWeight,
		debouncedRpe,
		weightState,
		repsState,
		rpeState,
		isWeightUnitTransition,
		isCompletedState,
		saveState,
		sessionId,
		routineExerciseId,
		setNumber,
		canSave,
		createPayload,
		weightOf,
	])

	// Immediate feedback effect for pending state
	useEffect(() => {
		if (isWeightUnitTransition) return

		const currentReps = Number(repsState) || 0
		const currentWeight = weightOf(weightState)
		const currentRpe = rpeState === '' ? undefined : Number(rpeState)
		// Normalize nullish weights for stable comparisons (null === undefined)
		const norm = (w: number | undefined | null) => (w == null ? null : w)
		const hasImmediateChange =
			currentReps !== lastSavedRef.current.reps ||
			!areCanonicalWeightsEqual(currentWeight, lastSavedRef.current.weight) ||
			norm(currentRpe) !== norm(lastSavedRef.current.rpe)

		if (hasImmediateChange && saveState === 'idle') {
			// Only mark as pending if we're not already in a save flow
			markSetPending(sessionId, routineExerciseId, setNumber)
		}
	}, [
		repsState,
		weightState,
		rpeState,
		saveState,
		sessionId,
		routineExerciseId,
		setNumber,
		weightOf,
		isWeightUnitTransition,
	])

	// Form handlers
	const setReps = useCallback((value: string) => {
		setRepsState(value)
	}, [])

	const setWeight = useCallback(
		(value: string) => {
			if (fixedWeightKg === undefined) setWeightState(value)
		},
		[fixedWeightKg],
	)

	const setRpe = useCallback((value: string) => {
		setRpeState(value)
	}, [])

	// A fill is one deliberate tap, not typing, so it saves at once instead of
	// waiting out the debounce: a reload straight after it keeps the values,
	// and the row below can offer them as its own fill.
	const fill = useCallback(
		(values: SetValues) => {
			const reps = values.reps > 0 ? String(values.reps) : ''
			const weight = formatWeightInput(
				fixedWeightKg ?? values.weight ?? undefined,
				weightUnit,
			)
			const rpe = values.rpe != null ? String(values.rpe) : ''
			setRepsState(reps)
			setWeightState(weight)
			setRpeState(rpe)

			const payload = createPayload(reps, weight, rpe, isCompletedState)
			if (!validateSetLogPayload(payload, t).isValid) return
			markSetPending(sessionId, routineExerciseId, setNumber)
			onSaveRef.current(payload)
			lastSavedRef.current = {
				reps: payload.reps,
				weight: payload.weight,
				rpe: payload.rpe,
				isCompleted: isCompletedState,
			}
		},
		[
			weightUnit,
			fixedWeightKg,
			createPayload,
			isCompletedState,
			sessionId,
			routineExerciseId,
			setNumber,
			t,
		],
	)

	const changeKind = useCallback(
		(kind: SetKind) => {
			const payload = createPayload(
				repsState,
				weightState,
				rpeState,
				isCompletedState,
			)
			if (!validateSetLogPayload(payload, t).isValid) return
			if (
				isCompletedState &&
				missingForCompletion({
					reps: repsState,
					weight: weightOf(weightState),
				})
			)
				return
			markSetPending(sessionId, routineExerciseId, setNumber)
			onSaveRef.current({ ...payload, kind })
			lastSavedRef.current = {
				reps: payload.reps,
				weight: payload.weight,
				rpe: payload.rpe,
				isCompleted: isCompletedState,
			}
		},
		[
			createPayload,
			repsState,
			weightState,
			rpeState,
			isCompletedState,
			sessionId,
			routineExerciseId,
			setNumber,
			weightOf,
			t,
		],
	)

	const handleCompletionToggle = useCallback(
		(checked: boolean, viaKeyboard = false): 'reps' | 'weight' | null => {
			// LIVE-21: a tick needs reps and a weight (0 for bodyweight). A
			// refused tick changes nothing: no completion, no rest, no save.
			// Unticking is always allowed.
			const tickWeight =
				checked && suggestionInput ? suggestionInput : weightState
			const missing = checked
				? missingForCompletion({
						reps: repsState,
						weight: weightOf(tickWeight),
					})
				: null
			if (missing) {
				setTickRefused(true)
				return missing
			}
			setTickRefused(false)
			if (tickWeight !== weightState) setWeightState(tickWeight)
			setIsCompletedState(checked)
			markSetPending(sessionId, routineExerciseId, setNumber)

			// Ticking a set is what starts rest (LIVE-01). Unticking is a
			// correction and must not restart the countdown.
			if (checked) onSetCompletedRef.current?.(viaKeyboard)

			// Immediately save completion toggle
			const payload = createPayload(repsState, tickWeight, rpeState, checked)
			if (validateSetLogPayload(payload, t).isValid) {
				onSaveRef.current(payload)
				// Update last saved values to prevent redundant saves
				const w = weightOf(tickWeight)
				const r = rpeState === '' ? undefined : Number(rpeState)
				lastSavedRef.current = {
					reps: Number(repsState) || 0,
					weight: w,
					rpe: r,
					isCompleted: checked,
				}
			}
			return null
		},
		[
			sessionId,
			routineExerciseId,
			setNumber,
			repsState,
			weightState,
			rpeState,
			suggestionInput,
			createPayload,
			weightOf,
			t,
		],
	)

	return {
		// Form state
		repsState,
		weightState,
		rpeState,
		isCompletedState,

		// Save state
		saveState,

		// Form handlers
		setReps,
		setWeight,
		setRpe,
		handleCompletionToggle,
		fill,
		changeKind,

		// Validation
		isValid: validation.isValid,
		validationError: validation.errors[0]?.message, // Use first error from errors array
		validationField: validation.errors[0]?.field,
		completionField,
	}
}
