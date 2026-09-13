import {
	EXERCISE_EQUIPMENT,
	type ExerciseEquipment,
	type TrainingLocationPreference,
} from '@sunsteel/contracts'

/**
 * The EXER-09 equipment vocabulary as people read it, and the bridge from the
 * free-text equipment a training location lists (PREF-01) onto that
 * vocabulary. Shared by the routine quality summary (ROUT-10) and exercise
 * alternatives (EXER-05).
 */

export const EQUIPMENT_LABELS: Record<ExerciseEquipment, string> = {
	barbell: 'Barbell',
	'ez-bar': 'EZ bar',
	dumbbell: 'Dumbbells',
	cable: 'Cable station',
	machine: 'Machines',
	'smith-machine': 'Smith machine',
	bench: 'Flat bench',
	'incline-bench': 'Incline bench',
	'preacher-bench': 'Preacher bench',
	rack: 'Rack',
	'pull-up-bar': 'Pull-up bar',
	'dip-station': 'Dip station',
	bodyweight: 'Bodyweight',
}

const EQUIPMENT_VOCABULARY = new Set<string>(EXERCISE_EQUIPMENT)

/**
 * Location equipment is free text ("barbell, rack, dumbbells"), so common
 * spellings are mapped onto the catalog vocabulary. An unrecognised entry is
 * simply not matched: callers then say an item is not *listed*, never that the
 * gym lacks it.
 */
const EQUIPMENT_ALIASES: Record<string, ExerciseEquipment[]> = {
	'adjustable-bench': ['bench', 'incline-bench'],
	'flat-bench': ['bench'],
	'cable-machine': ['cable'],
	'cable-station': ['cable'],
	cables: ['cable'],
	'chin-up-bar': ['pull-up-bar'],
	'chinup-bar': ['pull-up-bar'],
	'pullup-bar': ['pull-up-bar'],
	'dip-bar': ['dip-station'],
	'dip-bars': ['dip-station'],
	'ez-curl-bar': ['ez-bar'],
	ezbar: ['ez-bar'],
	'power-rack': ['rack'],
	'squat-rack': ['rack'],
	smith: ['smith-machine'],
	machines: ['machine'],
}

const toVocabulary = (item: string): ExerciseEquipment[] => {
	const slug = item
		.trim()
		.toLocaleLowerCase('en-US')
		.replace(/[\s_]+/g, '-')
	if (!slug) return []
	if (EQUIPMENT_ALIASES[slug]) return EQUIPMENT_ALIASES[slug]
	for (const candidate of [
		slug,
		slug.replace(/e?s$/, ''),
		slug.replace(/s$/, ''),
	]) {
		if (EQUIPMENT_VOCABULARY.has(candidate))
			return [candidate as ExerciseEquipment]
	}
	return []
}

export const normalizeLocationEquipment = (
	items: string[],
): Set<ExerciseEquipment> => new Set(items.flatMap(toVocabulary))

/** The location the app treats as "your gym": the default, else the first. */
export const defaultTrainingLocation = (
	locations: TrainingLocationPreference[] | undefined,
): TrainingLocationPreference | undefined =>
	locations?.find(location => location.isDefault) ?? locations?.[0]

/**
 * Equipment listed at a location in catalog terms, or null when nothing is
 * listed there — an empty list means "unknown", not "has nothing".
 */
export const listedEquipmentAt = (
	location: TrainingLocationPreference | undefined,
): Set<ExerciseEquipment> | null =>
	location && location.equipment.length > 0
		? normalizeLocationEquipment(location.equipment)
		: null
