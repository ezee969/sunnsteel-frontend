import type { RoutineWizardExercise } from '../types'

/**
 * UX-20 (design system §23.6): whether an exercise already uses something its
 * card folds under "More options". While it does, the options stay shown and
 * cannot fold, so nothing in use is ever hidden. The
 * progression scheme, rest and RIR always hold a value, so having one is not
 * using it; a set kind other than working, a generated warm-up and a link to
 * the next exercise are choices someone made.
 */
export function usesAdvancedOptions(
	exercise: Pick<RoutineWizardExercise, 'sets' | 'linkedToNext'>,
): boolean {
	if (exercise.linkedToNext) return true
	return exercise.sets.some(
		set =>
			(set.kind ?? 'WORKING') !== 'WORKING' ||
			typeof set.warmUpShare === 'number',
	)
}
