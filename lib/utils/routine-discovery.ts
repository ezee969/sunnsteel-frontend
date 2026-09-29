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

import type { Translator } from '@/i18n/translator'
import {
	getTrainingExperienceLabel,
	getTrainingGoalLabel,
} from '@/lib/utils/training-identity'

/**
 * ROUT-07 copy. The labels reuse the `PROF-05` ones, because a goal means the
 * same thing whether a person or a programme claims it; what differs is who
 * is making the claim, and that is a backend concern.
 */

type T = Translator<'routines.discovery'>

export function durationBandLabel(band: RoutineDurationBand, t: T): string {
	const { SHORT, MEDIUM } = ROUTINE_DURATION_BAND_MAX_MINUTES
	switch (band) {
		case 'SHORT':
			return t('durationShort', { max: SHORT })
		case 'MEDIUM':
			return t('durationMedium', { min: SHORT, max: MEDIUM })
		default:
			return t('durationLong', { min: MEDIUM })
	}
}

export const durationBandOptions = (t: T) =>
	ROUTINE_DURATION_BANDS.map(value => ({
		value,
		label: durationBandLabel(value, t),
	}))

/**
 * The duration is an estimate from sets, reps and rest, not a measured time,
 * and every surface that shows it has to say so — `ROUT-10` established that
 * and discovery quotes the same number from the same rule.
 */
export const durationEstimateNote = (t: T) => t('estimateNote')

/** What discovery can and cannot show, said once at the top of the page. */
export const discoveryScopeNote = (t: T) => t('scopeNote')

/** Shown when the bounded scan ran out before the whole catalogue did. */
export const discoveryTruncatedNote = (t: T) => t('truncatedNote')

/** A routine's declared claims, or an honest absence of them. */
export function describeClassification(
	routine: {
		goal?: TrainingGoal | null
		experienceLevel?: TrainingExperienceLevel | null
	},
	tIdentity: Translator<'routines.identity'>,
): string | null {
	const parts = [
		routine.goal ? getTrainingGoalLabel(routine.goal, tIdentity) : null,
		routine.experienceLevel
			? getTrainingExperienceLabel(routine.experienceLevel, tIdentity)
			: null,
	].filter(Boolean)
	// Null, not "Not specified": the caller decides whether an absent claim is
	// worth a line at all, and a routine is not worse for making none.
	return parts.length ? parts.join(' · ') : null
}

/** The one-line facts under a discovered routine's name. */
export function describeDiscoveredRoutine(
	routine: DiscoverableRoutine,
	t: T,
): string {
	return t('routineFacts', {
		days: routine.dayCount,
		exercises: routine.exerciseCount,
		mode: routine.scheduleMode === 'ROTATION' ? 'rotation' : 'weekly',
		minutes: routine.longestDayMinutes,
	})
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
