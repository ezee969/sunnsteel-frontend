import type { Translator } from '@/i18n/translator'

/**
 * I18N-07 will reuse this fixed vocabulary from the catalog and achievements.
 * Keys mirror `MUSCLE_GROUP_LABELS`' old English keys; an enum value with no
 * message key falls back to a lowercased, space-joined version of itself.
 */
const MUSCLE_GROUP_KEYS = {
	// Chest
	PECTORAL: 'pectoral',

	// Back
	LATISSIMUS_DORSI: 'latissimusDorsi',
	TRAPEZIUS: 'trapezius',
	RHOMBOIDS: 'rhomboids',
	TERES_MAJOR_MINOR: 'teresMajorMinor',
	ERECTOR_SPINAE: 'erectorSpinae',

	// Shoulders
	ANTERIOR_DELTOIDS: 'anteriorDeltoids',
	MEDIAL_DELTOIDS: 'medialDeltoids',
	REAR_DELTOIDS: 'rearDeltoids',

	// Arms
	BICEPS: 'biceps',
	TRICEPS: 'triceps',
	FOREARMS: 'forearms',

	// Legs
	QUADRICEPS: 'quadriceps',
	HAMSTRINGS: 'hamstrings',
	GLUTES: 'glutes',
	CALVES: 'calves',

	// Core
	CORE: 'core',
	ADDUCTOR: 'adductor',
} as const

type MuscleKey = (typeof MUSCLE_GROUP_KEYS)[keyof typeof MUSCLE_GROUP_KEYS]

/**
 * Convert technical muscle group name to user-friendly name
 */
export function getFriendlyMuscleName(
	muscleGroup: string,
	t: Translator<'routines.muscles'>,
): string {
	const key = (MUSCLE_GROUP_KEYS as Record<string, MuscleKey>)[muscleGroup]
	return key ? t(key) : muscleGroup.toLowerCase().replace(/_/g, ' ')
}

/**
 * Convert array of technical muscle names to friendly names
 */
export function getFriendlyMuscleNames(
	muscleGroups: string[],
	t: Translator<'routines.muscles'>,
): string[] {
	return muscleGroups.map(group => getFriendlyMuscleName(group, t))
}

/**
 * Format muscle groups for display (comma-separated)
 */
export function formatMuscleGroups(
	muscleGroups: string[],
	t: Translator<'routines.muscles'>,
	maxDisplay = 3,
): string {
	const friendlyNames = getFriendlyMuscleNames(muscleGroups, t)

	if (friendlyNames.length === 0) return ''
	if (friendlyNames.length <= maxDisplay) {
		return friendlyNames.join(', ')
	}

	const displayed = friendlyNames.slice(0, maxDisplay)
	const remaining = friendlyNames.length - maxDisplay
	return t('moreCount', { names: displayed.join(', '), count: remaining })
}
