import type {
	ProfileVisibility,
	RoutineVisibility,
	SharedRoutine,
	SharedRoutineSummary,
} from '@sunsteel/contracts'
import { ROUTINE_VISIBILITY_VALUES } from '@sunsteel/contracts'

/**
 * ROUT-04 copy. The rule worth stating plainly is that **two settings apply
 * and the narrower wins**: the account-level `PROF-06` routines rule caps
 * whatever a routine asks for. Without saying so, an owner who marks a routine
 * public inside a followers-only account would believe they had published it.
 */

export const ROUTINE_VISIBILITY_COPY: Record<
	RoutineVisibility,
	{ label: string; description: string }
> = {
	PRIVATE: {
		label: 'Only me',
		description: 'Nobody else can open this routine, even with a link removed.',
	},
	FOLLOWERS: {
		label: 'Followers',
		description: 'Members who follow you can find it on your profile.',
	},
	PUBLIC: {
		label: 'Everyone',
		description: 'Anyone can find it on your profile, signed in or not.',
	},
}

export const ROUTINE_VISIBILITY_OPTIONS = ROUTINE_VISIBILITY_VALUES.map(
	value => ({ value, ...ROUTINE_VISIBILITY_COPY[value] }),
)

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
): string | null {
	const effective = effectiveRoutineVisibility(
		accountRoutinesRule,
		routineVisibility,
	)
	if (effective === routineVisibility) return null

	const reached =
		effective === 'PRIVATE'
			? 'nobody else'
			: ROUTINE_VISIBILITY_COPY[effective].label.toLowerCase()
	// `ProfileVisibility` and `RoutineVisibility` carry the same three values,
	// so the account rule reads out of the same copy table.
	const accountLabel =
		ROUTINE_VISIBILITY_COPY[accountRoutinesRule].label.toLowerCase()
	return `Your profile shares routines with ${accountLabel}, so this reaches ${reached}. Change it in Settings under privacy.`
}

/** A link works whatever the visibility says, which the owner should know. */
export const ROUTINE_LINK_NOTE =
	'A link opens the routine for anyone who has it, whatever the setting above says. Revoking it is permanent.'

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
export const SHARED_ROUTINE_NOTE =
	'This is the routine as it is programmed — days, exercises, sets and targets. It carries none of the owner’s workouts, records or notes.'

// Routine cloning (ROUT-05) ---------------------------------------------------

/**
 * What a clone is, said before it is made. Two things are worth stating: the
 * copy is the reader's own from the moment it exists, and it carries the
 * programme rather than anything the original owner trained.
 */
export const CLONE_ROUTINE_NOTE =
	'Cloning saves this programme as a routine of your own. You can edit it freely; the original is untouched, and nothing you change reaches its owner.'

/** A clone is private until its new owner decides otherwise. */
export const CLONE_ROUTINE_PRIVACY_NOTE =
	'Your copy starts private, whoever could see the original.'

/** One line summarising a routine nobody has opened yet. */
export function describeRoutineSummary(routine: SharedRoutineSummary): string {
	const days = `${routine.dayCount} ${routine.dayCount === 1 ? 'day' : 'days'}`
	const exercises = `${routine.exerciseCount} ${
		routine.exerciseCount === 1 ? 'exercise' : 'exercises'
	}`
	const mode = routine.scheduleMode === 'ROTATION' ? 'Rotation' : 'Weekly'
	return `${days} · ${exercises} · ${mode}`
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
