import {
	EXERCISE_EQUIPMENT,
	type ExerciseEquipment,
	type ExerciseMechanic,
	MOVEMENT_PATTERNS,
	type MovementPattern,
	MUSCLE_GROUPS,
	type MuscleGroup,
} from '@sunsteel/contracts'

import type { MessageKey, Translator } from '@/i18n/translator'
import type { Exercise } from '@/lib/api/types/exercise.type'

import type { EmptyStateCopy } from './empty-states'
import { equipmentLabel } from './exercise-equipment'
import { getFriendlyMuscleName } from './muscle-groups'

/**
 * EXER-02 catalog browsing: the filters behind `/exercises`, their URL form and
 * the copy for every empty state. Everything here is pure so it runs in the
 * Node test environment.
 */

type UiT = Translator<'catalog.exercisesUi'>

export const MOVEMENT_PATTERN_KEYS = {
	HORIZONTAL_PUSH: 'movement.HORIZONTAL_PUSH',
	VERTICAL_PUSH: 'movement.VERTICAL_PUSH',
	HORIZONTAL_PULL: 'movement.HORIZONTAL_PULL',
	VERTICAL_PULL: 'movement.VERTICAL_PULL',
	SQUAT: 'movement.SQUAT',
	HINGE: 'movement.HINGE',
	LUNGE: 'movement.LUNGE',
	CHEST_FLY: 'movement.CHEST_FLY',
	SHOULDER_ABDUCTION: 'movement.SHOULDER_ABDUCTION',
	SHOULDER_FLEXION: 'movement.SHOULDER_FLEXION',
	SHOULDER_HORIZONTAL_ABDUCTION: 'movement.SHOULDER_HORIZONTAL_ABDUCTION',
	SHOULDER_EXTENSION: 'movement.SHOULDER_EXTENSION',
	SCAPULAR_ELEVATION: 'movement.SCAPULAR_ELEVATION',
	ELBOW_FLEXION: 'movement.ELBOW_FLEXION',
	ELBOW_EXTENSION: 'movement.ELBOW_EXTENSION',
	KNEE_EXTENSION: 'movement.KNEE_EXTENSION',
	KNEE_FLEXION: 'movement.KNEE_FLEXION',
	HIP_EXTENSION: 'movement.HIP_EXTENSION',
	PLANTAR_FLEXION: 'movement.PLANTAR_FLEXION',
	CORE_FLEXION: 'movement.CORE_FLEXION',
	CORE_ROTATION: 'movement.CORE_ROTATION',
	CORE_STABILITY: 'movement.CORE_STABILITY',
} as const satisfies Record<MovementPattern, MessageKey<'catalog.exercisesUi'>>

export const MECHANIC_KEYS = {
	COMPOUND: 'mechanic.COMPOUND',
	ISOLATION: 'mechanic.ISOLATION',
} as const satisfies Record<ExerciseMechanic, MessageKey<'catalog.exercisesUi'>>

export const movementPatternLabel = (t: UiT, pattern: MovementPattern) =>
	t(MOVEMENT_PATTERN_KEYS[pattern])

export const mechanicLabel = (t: UiT, mechanic: ExerciseMechanic) =>
	t(MECHANIC_KEYS[mechanic])

/** The equipment filter's extra value: "everything listed at my gym". */
export const GYM_EQUIPMENT_FILTER = 'gym'

export type CatalogEquipmentFilter =
	ExerciseEquipment | typeof GYM_EQUIPMENT_FILTER

export interface CatalogFilters {
	/** Name search, compared case-insensitively and trimmed. */
	q: string
	/** Matches a primary or a secondary muscle. */
	muscle: MuscleGroup | null
	equipment: CatalogEquipmentFilter | null
	pattern: MovementPattern | null
	/** Only exercises with at least one completed set in a finished session. */
	trained: boolean
	/** Only exercises the owner starred (EXER-07). */
	starred: boolean
	/** Only the owner's own exercises, archived ones included (EXER-06). */
	mine: boolean
}

export const EMPTY_CATALOG_FILTERS: CatalogFilters = {
	q: '',
	muscle: null,
	equipment: null,
	pattern: null,
	trained: false,
	starred: false,
	mine: false,
}

const oneOf = <T extends string>(
	values: readonly T[],
	value: string | null,
): T | null =>
	value !== null && (values as readonly string[]).includes(value)
		? (value as T)
		: null

/** Unknown or malformed values are dropped rather than trusted. */
export function parseCatalogFilters(params: {
	get(name: string): string | null
}): CatalogFilters {
	return {
		q: params.get('q')?.trim() ?? '',
		muscle: oneOf(MUSCLE_GROUPS, params.get('muscle')),
		equipment: oneOf<CatalogEquipmentFilter>(
			[...EXERCISE_EQUIPMENT, GYM_EQUIPMENT_FILTER],
			params.get('equipment'),
		),
		pattern: oneOf(MOVEMENT_PATTERNS, params.get('pattern')),
		trained: params.get('trained') === '1',
		starred: params.get('starred') === '1',
		mine: params.get('mine') === '1',
	}
}

/** Only active filters reach the URL, in a stable order. */
export function serializeCatalogFilters(filters: CatalogFilters): string {
	const params = new URLSearchParams()
	const q = filters.q.trim()
	if (q) params.set('q', q)
	if (filters.muscle) params.set('muscle', filters.muscle)
	if (filters.equipment) params.set('equipment', filters.equipment)
	if (filters.pattern) params.set('pattern', filters.pattern)
	if (filters.trained) params.set('trained', '1')
	if (filters.starred) params.set('starred', '1')
	if (filters.mine) params.set('mine', '1')
	return params.toString()
}

export function hasActiveCatalogFilters(filters: CatalogFilters): boolean {
	return Boolean(
		filters.q.trim() ||
		filters.muscle ||
		filters.equipment ||
		filters.pattern ||
		filters.trained ||
		filters.starred ||
		filters.mine,
	)
}

/**
 * UX-05: how many filters besides the name search are narrowing the list,
 * shown on the phone's "Filters" toggle so a closed panel still says it is
 * doing something.
 */
export function activeCatalogFilterCount(filters: CatalogFilters): number {
	return [
		filters.muscle,
		filters.equipment,
		filters.pattern,
		filters.trained,
		filters.starred,
		filters.mine,
	].filter(Boolean).length
}

/**
 * Every required item is listed at the gym. Bodyweight never needs listing,
 * as in the alternatives ranking. An exercise with no known requirements is
 * not claimed to fit.
 */
export function fitsListedEquipment(
	exercise: Pick<Exercise, 'equipmentRequired'>,
	listed: ReadonlySet<ExerciseEquipment>,
): boolean {
	return (
		exercise.equipmentRequired.length > 0 &&
		exercise.equipmentRequired.every(
			item => item === 'bodyweight' || listed.has(item),
		)
	)
}

export interface CatalogContext {
	/** Trained exercise ids; required only while the trained filter is on. */
	trainedIds: ReadonlySet<string> | null
	/** Equipment listed at the default location; required only for `gym`. */
	listedEquipment: ReadonlySet<ExerciseEquipment> | null
	/** Starred exercise ids; required only while the starred filter is on. */
	starredIds: ReadonlySet<string> | null
	/**
	 * I18N-07: the name as the member reads it. A search matches the stored
	 * name and this label, so Spanish can be searched in Spanish.
	 */
	label?: (name: string) => string
}

const fold = (value: string) =>
	value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('en-US')

function matchesSearch(
	name: string,
	query: string,
	label?: (name: string) => string,
): boolean {
	if (name.toLocaleLowerCase('en-US').includes(query)) return true
	const shown = label?.(name)
	return Boolean(shown && fold(shown).includes(fold(query)))
}

const byName = (a: Exercise, b: Exercise) =>
	a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })

/**
 * Applies every active filter. Results are alphabetical; with a muscle filter,
 * exercises that train it as a primary muscle come before those that only
 * involve it secondarily. A filter whose data is missing from `context`
 * matches nothing — callers render its loading or error state instead.
 * An archived custom exercise (EXER-06) shows only under "Yours".
 */
export function filterCatalog(
	exercises: readonly Exercise[],
	filters: CatalogFilters,
	context: CatalogContext,
): Exercise[] {
	const q = filters.q.trim().toLocaleLowerCase('en-US')
	const matches = exercises.filter(exercise => {
		if (filters.mine ? !exercise.isCustom : exercise.archivedAt) return false
		if (q && !matchesSearch(exercise.name, q, context.label)) return false
		if (
			filters.muscle &&
			!exercise.primaryMuscles.includes(filters.muscle) &&
			!exercise.secondaryMuscles.includes(filters.muscle)
		) {
			return false
		}
		if (filters.pattern && exercise.movementPattern !== filters.pattern) {
			return false
		}
		if (filters.equipment === GYM_EQUIPMENT_FILTER) {
			if (
				!context.listedEquipment ||
				!fitsListedEquipment(exercise, context.listedEquipment)
			) {
				return false
			}
		} else if (
			filters.equipment &&
			!exercise.equipmentRequired.includes(filters.equipment)
		) {
			return false
		}
		if (filters.trained && !context.trainedIds?.has(exercise.id)) {
			return false
		}
		if (filters.starred && !context.starredIds?.has(exercise.id)) {
			return false
		}
		return true
	})

	const muscle = filters.muscle
	if (!muscle) return matches.sort(byName)
	const primaryFirst = (exercise: Exercise) =>
		exercise.primaryMuscles.includes(muscle) ? 0 : 1
	return matches.sort(
		(a, b) => primaryFirst(a) - primaryFirst(b) || byName(a, b),
	)
}

export interface CatalogOption<T extends string> {
	value: T
	label: string
}

/**
 * Filter choices, in vocabulary order, limited to values the catalog actually
 * uses so no choice is empty by construction. A value already selected (from a
 * shared URL) stays listed even if the catalog no longer uses it.
 */
export function catalogFilterOptions(
	exercises: readonly Exercise[],
	selected: CatalogFilters,
	t: Translator<'routines.muscles'>,
	tEquip: Translator<'routines.equipment'>,
	tUi: UiT,
): {
	muscles: CatalogOption<MuscleGroup>[]
	equipment: CatalogOption<ExerciseEquipment>[]
	patterns: CatalogOption<MovementPattern>[]
} {
	const muscles = new Set<string>()
	const equipment = new Set<string>()
	const patterns = new Set<string>()
	for (const exercise of exercises) {
		exercise.primaryMuscles.forEach(muscle => muscles.add(muscle))
		exercise.secondaryMuscles.forEach(muscle => muscles.add(muscle))
		exercise.equipmentRequired.forEach(item => equipment.add(item))
		if (exercise.movementPattern) patterns.add(exercise.movementPattern)
	}
	if (selected.muscle) muscles.add(selected.muscle)
	if (selected.equipment && selected.equipment !== GYM_EQUIPMENT_FILTER) {
		equipment.add(selected.equipment)
	}
	if (selected.pattern) patterns.add(selected.pattern)

	return {
		muscles: MUSCLE_GROUPS.filter(value => muscles.has(value)).map(value => ({
			value,
			label: getFriendlyMuscleName(value, t),
		})),
		equipment: EXERCISE_EQUIPMENT.filter(value => equipment.has(value)).map(
			value => ({ value, label: equipmentLabel(value, tEquip) }),
		),
		patterns: MOVEMENT_PATTERNS.filter(value => patterns.has(value)).map(
			value => ({ value, label: movementPatternLabel(tUi, value) }),
		),
	}
}

/**
 * The gym filter needs equipment listed at the default location; an empty
 * list is unknown, so filtering by it would hide every exercise.
 */
export function getGymFilterUnavailableState(
	t: UiT,
	locationName: string | null,
): EmptyStateCopy {
	return {
		title: locationName
			? t('gymTitleNamed', { name: locationName })
			: t('gymTitleNone'),
		description: t('gymDescription'),
		action: {
			kind: 'link',
			label: t('openSettings'),
			href: '/settings/training',
		},
	}
}

export function formatCatalogCount(
	t: UiT,
	shown: number,
	total: number,
): string {
	return shown === total
		? t('countAll', { total })
		: t('countSome', { shown, total })
}

/**
 * Why the list is empty. `hasTrainedExercises` is null while the history is
 * unknown; the caller shows loading or error for that case instead.
 */
export function getCatalogEmptyState({
	t,
	catalogSize,
	filters,
	hasTrainedExercises,
	hasStarredExercises = null,
	hasCustomExercises = null,
}: {
	t: UiT
	catalogSize: number
	filters: CatalogFilters
	hasTrainedExercises: boolean | null
	hasStarredExercises?: boolean | null
	hasCustomExercises?: boolean | null
}): EmptyStateCopy {
	if (catalogSize === 0) {
		return {
			title: t('emptyCatalogTitle'),
			description: t('emptyCatalogBody'),
		}
	}
	if (filters.mine && hasCustomExercises === false) {
		return {
			title: t('emptyMineTitle'),
			description: t('emptyMineBody'),
			action: { kind: 'clear-filters', label: t('showAll') },
		}
	}
	if (filters.starred && hasStarredExercises === false) {
		return {
			title: t('emptyStarredTitle'),
			description: t('emptyStarredBody'),
			action: { kind: 'clear-filters', label: t('showAll') },
		}
	}
	if (filters.trained && hasTrainedExercises === false) {
		return {
			title: t('emptyTrainedTitle'),
			description: t('emptyTrainedBody'),
			action: { kind: 'clear-filters', label: t('showAll') },
		}
	}
	return {
		title: t('emptyNoMatchTitle'),
		description: t('emptyNoMatchBody'),
		action: { kind: 'clear-filters', label: t('clearFilters') },
	}
}
