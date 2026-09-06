import { useCallback, useEffect, useRef, useState } from 'react'

import type { RoutineWizardData } from '../types'
import { sanitizeDecimalInput } from '../utils/validation.helpers'

interface UseExerciseCardStateOptions {
	exercise: RoutineWizardData['days'][number]['exercises'][number]
	exerciseIndex: number
	tabIndex: number
	onAddSet: (exerciseIndex: number) => void
	onUpdateMinWeightIncrement: (exerciseIndex: number, increment: number) => void
}

interface UseExerciseCardStateResult {
	registerSetRowRef: (index: number, node: HTMLDivElement | null) => void
	setsExpanded: boolean
	toggleSetsExpanded: () => void
	handleAddSet: () => void
	weightIncInput: string
	handleWeightIncChange: (value: string) => void
	handleWeightIncBlur: () => void
}

/**
 * Manage local UI state and interaction handlers for a single exercise card in the wizard.
 *
 * Keeps the minimum weight increment synchronized with the exercise, tracks
 * expansion of the sets list, manages row refs and scrolls a newly added set
 * into view.
 *
 * @returns An object containing state and handlers for the exercise card:
 * - `registerSetRowRef`: register a DOM ref for a set row by index
 * - `setsExpanded`: whether the sets list is expanded
 * - `toggleSetsExpanded`: toggle the sets expanded state
 * - `handleAddSet`: request adding a new set (and scroll to it)
 * - `weightIncInput`: current minimum weight increment input string
 * - `handleWeightIncChange`: update weight increment input text
 * - `handleWeightIncBlur`: validate and commit weight increment input to parent
 */
export function useExerciseCardState({
	exercise,
	exerciseIndex,
	onAddSet,
	onUpdateMinWeightIncrement,
}: UseExerciseCardStateOptions): UseExerciseCardStateResult {
	const setRowRefs = useRef<(HTMLDivElement | null)[]>([])
	const [setsExpanded, setSetsExpanded] = useState(true)
	const [shouldScrollToLast, setShouldScrollToLast] = useState(false)
	const [weightIncInput, setWeightIncInput] = useState<string>(
		exercise.minWeightIncrement !== undefined &&
			exercise.minWeightIncrement !== null
			? String(exercise.minWeightIncrement)
			: '',
	)

	useEffect(() => {
		const parentValue = exercise.minWeightIncrement
		setWeightIncInput(
			parentValue !== undefined && parentValue !== null
				? String(parentValue)
				: '',
		)
	}, [exercise.minWeightIncrement])

	useEffect(() => {
		if (!shouldScrollToLast) return
		const lastNode = setRowRefs.current[exercise.sets.length - 1]
		if (lastNode) {
			lastNode.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
		}
		setShouldScrollToLast(false)
	}, [exercise.sets.length, shouldScrollToLast])

	const registerSetRowRef = useCallback(
		(index: number, node: HTMLDivElement | null) => {
			setRowRefs.current[index] = node
		},
		[],
	)

	const toggleSetsExpanded = useCallback(() => {
		setSetsExpanded(previous => !previous)
	}, [])

	const handleAddSet = useCallback(() => {
		setShouldScrollToLast(true)
		onAddSet(exerciseIndex)
	}, [exerciseIndex, onAddSet])

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
			parentValue !== undefined && parentValue !== null
				? String(parentValue)
				: '',
		)
	}, [
		exercise.minWeightIncrement,
		exerciseIndex,
		onUpdateMinWeightIncrement,
		weightIncInput,
	])

	return {
		registerSetRowRef,
		setsExpanded,
		toggleSetsExpanded,
		handleAddSet,
		weightIncInput,
		handleWeightIncChange,
		handleWeightIncBlur,
	}
}
