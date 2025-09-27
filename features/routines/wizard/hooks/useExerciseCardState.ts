import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RoutineWizardData } from '../types'
import { sanitizeDecimalInput } from '../utils/validation.helpers'

interface UseExerciseCardStateOptions {
	exercise: RoutineWizardData['days'][number]['exercises'][number]
	exerciseIndex: number
	tabIndex: number
	onAddSet: (exerciseIndex: number) => void
	onUpdateProgramTMKg: (exerciseIndex: number, tmKg: number) => void
	onUpdateMinWeightIncrement: (exerciseIndex: number, increment: number) => void
}

interface UseExerciseCardStateResult {
	registerSetRowRef: (index: number, node: HTMLDivElement | null) => void
	setsExpanded: boolean
	toggleSetsExpanded: () => void
	handleAddSet: () => void
	tmInput: string
	tmMissing: boolean
	helpId: string
	handleTmInputChange: (value: string) => void
	handleTmBlur: () => void
	weightIncInput: string
	handleWeightIncChange: (value: string) => void
	handleWeightIncBlur: () => void
}

/**
 * Manage local UI state and interaction handlers for a single exercise card in the wizard.
 *
 * Keeps local inputs for program TM (kg) and minimum weight increment synchronized with the
 * provided exercise data, tracks expansion of the sets list, manages refs for set row elements,
 * and automatically scrolls the last set into view when a new set is added.
 *
 * @returns An object containing state and handlers for the exercise card:
 * - `registerSetRowRef`: register a DOM ref for a set row by index
 * - `setsExpanded`: whether the sets list is expanded
 * - `toggleSetsExpanded`: toggle the sets expanded state
 * - `handleAddSet`: request adding a new set (and scroll to it)
 * - `tmInput`: current TM input string
 * - `tmMissing`: `true` when the exercise has no valid program TM
 * - `helpId`: accessibility id for TM help text
 * - `handleTmInputChange`: update TM input text
 * - `handleTmBlur`: validate and commit TM input to parent
 * - `weightIncInput`: current minimum weight increment input string
 * - `handleWeightIncChange`: update weight increment input text
 * - `handleWeightIncBlur`: validate and commit weight increment input to parent
 */
export function useExerciseCardState({
	exercise,
	exerciseIndex,
	tabIndex,
	onAddSet,
	onUpdateProgramTMKg,
	onUpdateMinWeightIncrement,
}: UseExerciseCardStateOptions): UseExerciseCardStateResult {
	const setRowRefs = useRef<(HTMLDivElement | null)[]>([])
	const [setsExpanded, setSetsExpanded] = useState(true)
	const [shouldScrollToLast, setShouldScrollToLast] = useState(false)
	const [weightIncInput, setWeightIncInput] = useState<string>(
		exercise.minWeightIncrement !== undefined && exercise.minWeightIncrement !== null
			? String(exercise.minWeightIncrement)
			: '',
	)
	const [tmInput, setTmInput] = useState<string>(
		exercise.programTMKg !== undefined && !Number.isNaN(exercise.programTMKg)
			? String(exercise.programTMKg)
			: '',
	)

	const helpId = useMemo(
		() => `tm-help-${tabIndex}-${exerciseIndex}`,
		[tabIndex, exerciseIndex],
	)

	const tmMissing = useMemo(
		() => exercise.programTMKg === undefined || Number.isNaN(exercise.programTMKg),
		[exercise.programTMKg],
	)

	useEffect(() => {
		const parentValue = exercise.minWeightIncrement
		setWeightIncInput(
			parentValue !== undefined && parentValue !== null ? String(parentValue) : '',
		)
	}, [exercise.minWeightIncrement])

	useEffect(() => {
		const parentValue = exercise.programTMKg
		setTmInput(
			parentValue !== undefined && !Number.isNaN(parentValue) ? String(parentValue) : '',
		)
	}, [exercise.programTMKg])

	useEffect(() => {
		if (!shouldScrollToLast) return
		const lastNode = setRowRefs.current[exercise.sets.length - 1]
		if (lastNode) {
			lastNode.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
		}
		setShouldScrollToLast(false)
	}, [exercise.sets.length, shouldScrollToLast])

	const registerSetRowRef = useCallback((index: number, node: HTMLDivElement | null) => {
		setRowRefs.current[index] = node
	}, [])

	const toggleSetsExpanded = useCallback(() => {
		setSetsExpanded((previous) => !previous)
	}, [])

	const handleAddSet = useCallback(() => {
		setShouldScrollToLast(true)
		onAddSet(exerciseIndex)
	}, [exerciseIndex, onAddSet])

	const handleTmInputChange = useCallback((value: string) => {
		setTmInput(sanitizeDecimalInput(value))
	}, [])

	const handleTmBlur = useCallback(() => {
		const trimmed = tmInput.trim()
		if (trimmed === '') {
			onUpdateProgramTMKg(exerciseIndex, Number.NaN)
			setTmInput('')
			return
		}

		const parsed = Number.parseFloat(trimmed)
		if (!Number.isNaN(parsed) && parsed > 0) {
			onUpdateProgramTMKg(exerciseIndex, parsed)
			setTmInput(String(parsed))
			return
		}

		const parentValue = exercise.programTMKg
		setTmInput(
			parentValue !== undefined && !Number.isNaN(parentValue) ? String(parentValue) : '',
		)
	}, [exercise.programTMKg, exerciseIndex, onUpdateProgramTMKg, tmInput])

	const handleWeightIncChange = useCallback((value: string) => {
		setWeightIncInput(sanitizeDecimalInput(value))
	}, [])

	const handleWeightIncBlur = useCallback(() => {
		const trimmed = weightIncInput.trim()
		if (trimmed === '') {
			return
		}

		const parsed = Number.parseFloat(trimmed)
		if (!Number.isNaN(parsed) && parsed > 0) {
			onUpdateMinWeightIncrement(exerciseIndex, parsed)
			setWeightIncInput(String(parsed))
			return
		}

		const parentValue = exercise.minWeightIncrement
		setWeightIncInput(
			parentValue !== undefined && parentValue !== null ? String(parentValue) : '',
		)
	}, [exercise.minWeightIncrement, exerciseIndex, onUpdateMinWeightIncrement, weightIncInput])

	return {
		registerSetRowRef,
		setsExpanded,
		toggleSetsExpanded,
		handleAddSet,
		tmInput,
		tmMissing,
		helpId,
		handleTmInputChange,
		handleTmBlur,
		weightIncInput,
		handleWeightIncChange,
		handleWeightIncBlur,
	}
}
