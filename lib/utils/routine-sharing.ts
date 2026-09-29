import type {
	ProfileVisibility,
	RoutineVisibility,
	SharedRoutine,
	SharedRoutineSummary,
} from '@sunsteel/contracts'
import { ROUTINE_VISIBILITY_VALUES } from '@sunsteel/contracts'

import type { MessageKey, Translator } from '@/i18n/translator'

/**
 * ROUT-04 copy. The rule worth stating plainly is that **two settings apply
 * and the narrower wins**: the account-level `PROF-06` routines rule caps
 * whatever a routine asks for. Without saying so, an owner who marks a routine
 * public inside a followers-only account would believe they had published it.
 */

type T = Translator<'routines.sharing'>
type Key = MessageKey<'routines.sharing'>

const VISIBILITY_KEYS = {
	PRIVATE: {
		label: 'visibilityPrivateLabel',
		description: 'visibilityPrivateDescription',
	},
	FOLLOWERS: {
		label: 'visibilityFollowersLabel',
		description: 'visibilityFollowersDescription',
	},
	PUBLIC: {
		label: 'visibilityPublicLabel',
		description: 'visibilityPublicDescription',
	},
} as const satisfies Record<RoutineVisibility, { label: Key; description: Key }>

export function routineVisibilityCopy(
	value: RoutineVisibility,
	t: T,
): { label: string; description: string } {
	const keys = VISIBILITY_KEYS[value]
	return { label: t(keys.label), description: t(keys.description) }
}

export function routineVisibilityOptions(t: T) {
	return ROUTINE_VISIBILITY_VALUES.map(value => ({
		value,
		...routineVisibilityCopy(value, t),
	}))
}

/** The narrower of the two rules — what the owner is actually granting. */
export function effectiveRoutineVisibility(
	accountRoutinesRule: ProfileVisibility,
	routineVisibility: RoutineVisibility,
): RoutineVisibility {
	if (routineVisibility === 'PRIVATE') return 'PRIVATE'
	if (accountRoutinesRule === 'PRIVATE') return 'PRIVATE'
	if (accountRoutinesRule === 'FOLLOWERS') return 'FOLLOWERS'
	return routineVisibility
}

/**
 * Null when the routine's own setting is what applies. Otherwise the sentence
 * naming the account rule that is narrowing it, and where to change it.
 */
export function describeVisibilityCap(
	accountRoutinesRule: ProfileVisibility,
	routineVisibility: RoutineVisibility,
	t: T,
): string | null {
	const effective = effectiveRoutineVisibility(
		accountRoutinesRule,
		routineVisibility,
	)
	if (effective === routineVisibility) return null

	const reached =
		effective === 'PRIVATE'
			? t('capNobodyElse')
			: routineVisibilityCopy(effective, t).label.toLowerCase()
	// `ProfileVisibility` and `RoutineVisibility` carry the same three values,
	// so the account rule reads out of the same copy table.
	const account = routineVisibilityCopy(
		accountRoutinesRule,
		t,
	).label.toLowerCase()
	return t('cap', { account, reached })
}

/** A link works whatever the visibility says, which the owner should know. */
export const routineLinkNote = (t: T) => t('linkNote')

export function routineShareUrl(origin: string, token: string): string {
	return `${origin.replace(/\/$/, '')}/shared/routines/${token}`
}

/** How many exercises a shared routine prescribes, for a one-line summary. */
export function countSharedExercises(routine: SharedRoutine): number {
	return routine.setup.days.reduce(
		(total, day) => total + day.exercises.length,
		0,
	)
}

export function describeSharedRoutineOwner(routine: SharedRoutine): string {
	const { name, lastName } = routine.owner
	return [name, lastName].filter(Boolean).join(' ') || routine.owner.username
}

/**
 * What a reader is looking at. A shared routine is the prescription and never
 * the owner's training, and the page says so rather than leaving a reader to
 * wonder whether they are seeing someone's logged sessions.
 */
export const sharedRoutineNote = (t: T) => t('sharedNote')

// Routine cloning (ROUT-05) ---------------------------------------------------

/**
 * What a clone is, said before it is made. Two things are worth stating: the
 * copy is the reader's own from the moment it exists, and it carries the
 * programme rather than anything the original owner trained.
 */
export const cloneRoutineNote = (t: T) => t('cloneNote')

/** A clone is private until its new owner decides otherwise. */
export const cloneRoutinePrivacyNote = (t: T) => t('clonePrivacyNote')

/** One line summarising a routine nobody has opened yet. */
export function describeRoutineSummary(
	routine: SharedRoutineSummary,
	t: T,
): string {
	return t('summary', {
		days: t('summaryDays', { count: routine.dayCount }),
		exercises: t('summaryExercises', { count: routine.exerciseCount }),
		mode:
			routine.scheduleMode === 'ROTATION'
				? t('summaryRotation')
				: t('summaryWeekly'),
	})
}

/**
 * `/profile/<identifier>/routines/<routineId>` — one member's routine as the
 * viewer may read it (PROF-08's featured slot leads here, ROUT-05 clones from
 * it). It is a sub-path of the profile because whose routine it is decides
 * whether it can be read at all.
 */
export function parseProfileRoutineId(segments: string[]): string | null {
	if (segments.length !== 3) return null
	return segments[1] === 'routines' && segments[2] ? segments[2] : null
}

export function profileRoutineHref(identifier: string, routineId: string) {
	return `/profile/${encodeURIComponent(identifier)}/routines/${encodeURIComponent(routineId)}`
}

/**
 * Why the Settings routine picker is offering nothing. The account rule is
 * named first because it outranks every routine: saying "no routine is shared
 * yet" while the profile keeps all routines private sends the owner to change
 * a setting that would change nothing.
 */
export function describeNoFeaturableRoutines(
	accountRoutinesRule: ProfileVisibility,
	counts: { routines: number; shareable: number },
	t: T,
): string {
	if (accountRoutinesRule === 'PRIVATE') return t('noneAccountPrivate')
	if (counts.routines === 0) return t('noneCreateOne')
	if (counts.shareable === 0) return t('noneSharedYet')
	return t('allFeatured')
}
