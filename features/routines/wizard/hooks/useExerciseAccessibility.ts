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
