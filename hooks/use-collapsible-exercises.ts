import { useCallback, useState } from 'react'

interface UseCollapsibleExercisesReturn {
	/**
	 * Fold or open one exercise. `folded` is how it shows now -- the member's
	 * choice, else its default -- so a tap always does what it looks like.
	 */
	toggleExercise: (exerciseId: string, folded: boolean) => void
	/** LIVE-21: fold one exercise; folding a folded one changes nothing. */
	collapseExercise: (exerciseId: string) => void
	/** Open one exercise; opening an open one changes nothing. */
	expandExercise: (exerciseId: string) => void
	/**
	 * Whether an exercise shows folded: the member's choice when there is one,
	 * else `byDefault`. LIVE-22 (§27.4): the workout screen passes its default
	 * -- open while the exercise is the current one, folded before and after.
	 */
	isCollapsed: (exerciseId: string, byDefault?: boolean) => boolean
}

/**
 * Which exercises of a live workout show folded. A member's tap is kept as a
 * choice that wins over the default, so the screen never reopens what they
 * folded or folds what they opened.
 */
export const useCollapsibleExercises = (): UseCollapsibleExercisesReturn => {
	const [choices, setChoices] = useState<ReadonlyMap<string, boolean>>(
		new Map(),
	)

	const choose = useCallback((exerciseId: string, folded: boolean) => {
		setChoices(prev =>
			prev.get(exerciseId) === folded
				? prev
				: new Map(prev).set(exerciseId, folded),
		)
	}, [])

	const toggleExercise = useCallback(
		(exerciseId: string, folded: boolean) => choose(exerciseId, !folded),
		[choose],
	)
	const collapseExercise = useCallback(
		(exerciseId: string) => choose(exerciseId, true),
		[choose],
	)
	const expandExercise = useCallback(
		(exerciseId: string) => choose(exerciseId, false),
		[choose],
	)

	const isCollapsed = useCallback(
		(exerciseId: string, byDefault = false) =>
			choices.get(exerciseId) ?? byDefault,
		[choices],
	)

	return { toggleExercise, collapseExercise, expandExercise, isCollapsed }
}
