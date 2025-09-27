import { useCallback, useMemo } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'

interface UseExerciseAccessibilityOptions {
	tabIndex: number
	exerciseIndex: number
	expanded: boolean
	onToggleExpand: (exerciseIndex: number) => void
	onRemoveExercise: (exerciseIndex: number) => void
}

interface UseExerciseAccessibilityResult {
	controlsId: string
	handleHeaderClick: () => void
	handleHeaderKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
	handleToggleButtonClick: (event: MouseEvent<HTMLButtonElement>) => void
	handleRemoveButtonClick: (event: MouseEvent<HTMLButtonElement>) => void
}

/**
 * Provides stable IDs and event handlers to manage keyboard and mouse accessibility for an exercise row.
 *
 * @param tabIndex - Numerical index used to derive a deterministic `controlsId` for ARIA relationships
 * @param exerciseIndex - Index of the exercise this hook manages; passed to callbacks when actions occur
 * @param expanded - Whether the exercise row is currently expanded
 * @param onToggleExpand - Callback invoked with `exerciseIndex` to toggle the row's expanded state
 * @param onRemoveExercise - Callback invoked with `exerciseIndex` to remove the exercise
 * @returns An object with:
 *  - `controlsId`: ID string for ARIA `aria-controls` (formed as `sets-{tabIndex}-{exerciseIndex}`)
 *  - `handleHeaderClick`: click handler that toggles expansion for this exercise
 *  - `handleHeaderKeyDown`: keydown handler that toggles expansion when Enter or Space is pressed
 *  - `handleToggleButtonClick`: button click handler that stops propagation and toggles expansion
 *  - `handleRemoveButtonClick`: button click handler that stops propagation and removes the exercise
 */
export function useExerciseAccessibility({
	tabIndex,
	exerciseIndex,
	expanded,
	onToggleExpand,
	onRemoveExercise,
}: UseExerciseAccessibilityOptions): UseExerciseAccessibilityResult {
	const controlsId = useMemo(
		() => `sets-${tabIndex}-${exerciseIndex}`,
		[tabIndex, exerciseIndex],
	)

	const handleHeaderClick = useCallback(() => {
		onToggleExpand(exerciseIndex)
	}, [exerciseIndex, onToggleExpand])

	const handleHeaderKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			if (event.key !== 'Enter' && event.key !== ' ') return
			event.preventDefault()
			onToggleExpand(exerciseIndex)
		},
		[exerciseIndex, onToggleExpand],
	)

	const handleToggleButtonClick = useCallback(
		(event: MouseEvent<HTMLButtonElement>) => {
			event.stopPropagation()
			onToggleExpand(exerciseIndex)
		},
		[exerciseIndex, onToggleExpand],
	)

	const handleRemoveButtonClick = useCallback(
		(event: MouseEvent<HTMLButtonElement>) => {
			event.stopPropagation()
			onRemoveExercise(exerciseIndex)
		},
		[exerciseIndex, onRemoveExercise],
	)

	return {
		controlsId,
		handleHeaderClick,
		handleHeaderKeyDown,
		handleToggleButtonClick,
		handleRemoveButtonClick,
	}
}
