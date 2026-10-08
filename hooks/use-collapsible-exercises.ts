import { useCallback, useState } from 'react'

interface UseCollapsibleExercisesReturn {
	collapsedExercises: Set<string>
	toggleExercise: (exerciseId: string) => void
	/** LIVE-21: fold one exercise; folding a folded one changes nothing. */
	collapseExercise: (exerciseId: string) => void
	/** Open one exercise; opening an open one changes nothing. */
	expandExercise: (exerciseId: string) => void
	collapseAll: (exerciseIds: string[]) => void
	expandAll: () => void
	isCollapsed: (exerciseId: string) => boolean
}

/**
 * Custom hook for managing collapsible exercise state in workout sessions
 */
export const useCollapsibleExercises = (
	initialCollapsed: string[] = [],
): UseCollapsibleExercisesReturn => {
	const [collapsedExercises, setCollapsedExercises] = useState<Set<string>>(
		new Set(initialCollapsed),
	)

	const toggleExercise = useCallback((exerciseId: string) => {
		setCollapsedExercises(prev => {
			const newSet = new Set(prev)
			if (newSet.has(exerciseId)) {
				newSet.delete(exerciseId)
			} else {
				newSet.add(exerciseId)
			}
			return newSet
		})
	}, [])

	const collapseExercise = useCallback((exerciseId: string) => {
		setCollapsedExercises(prev =>
			prev.has(exerciseId) ? prev : new Set(prev).add(exerciseId),
		)
	}, [])

	const expandExercise = useCallback((exerciseId: string) => {
		setCollapsedExercises(prev => {
			if (!prev.has(exerciseId)) return prev
			const next = new Set(prev)
			next.delete(exerciseId)
			return next
		})
	}, [])

	const collapseAll = useCallback((exerciseIds: string[]) => {
		setCollapsedExercises(new Set(exerciseIds))
	}, [])

	const expandAll = useCallback(() => {
		setCollapsedExercises(new Set())
	}, [])

	const isCollapsed = useCallback(
		(exerciseId: string) => {
			return collapsedExercises.has(exerciseId)
		},
		[collapsedExercises],
	)

	return {
		collapsedExercises,
		toggleExercise,
		collapseExercise,
		expandExercise,
		collapseAll,
		expandAll,
		isCollapsed,
	}
}
