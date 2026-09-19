import type {
	DiscoverableRoutine,
	RoutineDurationBand,
	TrainingExperienceLevel,
	TrainingGoal,
} from '@sunsteel/contracts'
import {
	ROUTINE_DURATION_BAND_MAX_MINUTES,
	ROUTINE_DURATION_BANDS,
} from '@sunsteel/contracts'

import {
	getTrainingExperienceLabel,
	getTrainingGoalLabel,
} from '@/lib/utils/training-identity'

/**
 * ROUT-07 copy. The labels reuse the `PROF-05` ones, because a goal means the
 * same thing whether a person or a programme claims it; what differs is who
 * is making the claim, and that is a backend concern.
 */

export const DURATION_BAND_LABELS: Record<RoutineDurationBand, string> = {
	SHORT: `Under ${ROUTINE_DURATION_BAND_MAX_MINUTES.SHORT} min`,
	MEDIUM: `${ROUTINE_DURATION_BAND_MAX_MINUTES.SHORT}–${ROUTINE_DURATION_BAND_MAX_MINUTES.MEDIUM} min`,
	LONG: `Over ${ROUTINE_DURATION_BAND_MAX_MINUTES.MEDIUM} min`,
}

export const DURATION_BAND_OPTIONS = ROUTINE_DURATION_BANDS.map(value => ({
	value,
	label: DURATION_BAND_LABELS[value],
}))

/**
 * The duration is an estimate from sets, reps and rest, not a measured time,
 * and every surface that shows it has to say so — `ROUT-10` established that
 * and discovery quotes the same number from the same rule.
 */
export const DURATION_ESTIMATE_NOTE =
	'Session lengths are estimated from the sets, reps and rest each day programs, not measured from anyone’s workouts.'

/** What discovery can and cannot show, said once at the top of the page. */
export const DISCOVERY_SCOPE_NOTE =
	'These are routines members chose to share. You see the same ones you could already open from their profile — browsing does not reveal anything that was private.'

/** Shown when the bounded scan ran out before the whole catalogue did. */
export const DISCOVERY_TRUNCATED_NOTE =
	'Showing the most recently updated routines. Narrow the filters to reach older ones.'

/** A routine's declared claims, or an honest absence of them. */
export function describeClassification(routine: {
	goal?: TrainingGoal | null
	experienceLevel?: TrainingExperienceLevel | null
}): string | null {
	const parts = [
		routine.goal ? getTrainingGoalLabel(routine.goal) : null,
		routine.experienceLevel
			? getTrainingExperienceLabel(routine.experienceLevel)
			: null,
	].filter(Boolean)
	// Null, not "Not specified": the caller decides whether an absent claim is
	// worth a line at all, and a routine is not worse for making none.
	return parts.length ? parts.join(' · ') : null
}

/** The one-line facts under a discovered routine's name. */
export function describeDiscoveredRoutine(
	routine: DiscoverableRoutine,
): string {
	const days = `${routine.dayCount} ${routine.dayCount === 1 ? 'day' : 'days'}`
	const exercises = `${routine.exerciseCount} ${
		routine.exerciseCount === 1 ? 'exercise' : 'exercises'
	}`
	const mode = routine.scheduleMode === 'ROTATION' ? 'Rotation' : 'Weekly'
	return `${days} · ${exercises} · ${mode} · ~${routine.longestDayMinutes} min`
}

export function describeDiscoveredAuthor(routine: DiscoverableRoutine): string {
	const { name, lastName, username } = routine.author
	return [name, lastName].filter(Boolean).join(' ') || `@${username}`
}

/** True when the viewer has narrowed anything, for the empty state's wording. */
export function hasActiveFilters(query: {
	q?: string
	goal?: TrainingGoal
	experienceLevel?: TrainingExperienceLevel
	days?: number
	muscle?: string
	equipment?: string[]
	duration?: RoutineDurationBand
}): boolean {
	return Boolean(
		query.q?.trim() ||
		query.goal ||
		query.experienceLevel ||
		typeof query.days === 'number' ||
		query.muscle ||
		query.equipment?.length ||
		query.duration,
	)
}
