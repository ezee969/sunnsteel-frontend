import type { Routine, RoutineVisibility } from '@sunsteel/contracts'

import type { Translator } from '@/i18n/translator'

type PlanningRoutine = Pick<
	Routine,
	| 'visibility'
	| 'trainingBlocks'
	| 'temporaryOverrides'
	| 'isHiddenByModeration'
>

/**
 * UX-20 (design system §23.6): whether a routine already uses anything in its
 * folded "Planning and sharing" group, so the group opens with the page. A
 * routine anyone else can find, a training block, a deload or a moderation
 * hide is something the owner should see without asking; versions and private
 * links live in their own reads, so the page cannot know of them up front.
 */
export function planningInUse(routine: PlanningRoutine): boolean {
	return (
		(routine.visibility ?? 'PRIVATE') !== 'PRIVATE' ||
		(routine.trainingBlocks?.length ?? 0) > 0 ||
		(routine.temporaryOverrides?.length ?? 0) > 0 ||
		routine.isHiddenByModeration === true
	)
}

const VISIBILITY_KEY = {
	PRIVATE: 'visibilityPrivateLabel',
	FOLLOWERS: 'visibilityFollowersLabel',
	PUBLIC: 'visibilityPublicLabel',
} as const satisfies Record<RoutineVisibility, string>

/** The one line the folded group keeps: who finds it, blocks and deloads. */
export function describePlanningSummary(
	routine: PlanningRoutine,
	t: Translator<'routines.detail'>,
	tSharing: Translator<'routines.sharing'>,
): string {
	return t('planningSummary', {
		visibility: tSharing(VISIBILITY_KEY[routine.visibility ?? 'PRIVATE']),
		blocks: routine.trainingBlocks?.length ?? 0,
		deloads: routine.temporaryOverrides?.length ?? 0,
	})
}
