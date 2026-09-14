import {
	EXERCISE_EQUIPMENT,
	type ExerciseEquipment,
	type ExerciseMechanic,
	MOVEMENT_PATTERNS,
	type MovementPattern,
	MUSCLE_GROUPS,
	type MuscleGroup,
} from '@sunsteel/contracts'

import type { Exercise } from '@/lib/api/types/exercise.type'

import type { EmptyStateCopy } from './empty-states'
import { EQUIPMENT_LABELS } from './exercise-equipment'
import { getFriendlyMuscleName } from './muscle-groups'

/**
 * EXER-02 catalog browsing: the filters behind `/exercises`, their URL form and
 * the copy for every empty state. Everything here is pure so it runs in the
 * Node test environment.
 */

export const MOVEMENT_PATTERN_LABELS: Record<MovementPattern, string> = {
	HORIZONTAL_PUSH: 'Horizontal push',
	VERTICAL_PUSH: 'Vertical push',
	HORIZONTAL_PULL: 'Horizontal pull',
	VERTICAL_PULL: 'Vertical pull',
	SQUAT: 'Squat',
	HINGE: 'Hinge',
	LUNGE: 'Lunge',
	CHEST_FLY: 'Chest fly',
	SHOULDER_ABDUCTION: 'Shoulder abduction',
	SHOULDER_FLEXION: 'Front raise',
	SHOULDER_HORIZONTAL_ABDUCTION: 'Rear-delt fly',
	SHOULDER_EXTENSION: 'Shoulder extension',
	SCAPULAR_ELEVATION: 'Shrug',
	ELBOW_FLEXION: 'Elbow flexion',
	ELBOW_EXTENSION: 'Elbow extension',
	KNEE_EXTENSION: 'Knee extension',
	KNEE_FLEXION: 'Knee flexion',
	HIP_EXTENSION: 'Hip extension',
	PLANTAR_FLEXION: 'Calf raise',
	CORE_FLEXION: 'Core flexion',
	CORE_ROTATION: 'Core rotation',
	CORE_STABILITY: 'Core stability',
}

export const MECHANIC_LABELS: Record<ExerciseMechanic, string> = {
	COMPOUND: 'Compound',
	ISOLATION: 'Isolation',
}

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
}

export const EMPTY_CATALOG_FILTERS: CatalogFilters = {
	q: '',
	muscle: null,
	equipment: null,
	pattern: null,
	trained: false,
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
	return params.toString()
}

export function hasActiveCatalogFilters(filters: CatalogFilters): boolean {
	return Boolean(
		filters.q.trim() ||
		filters.muscle ||
		filters.equipment ||
		filters.pattern ||
		filters.trained,
	)
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
}

const byName = (a: Exercise, b: Exercise) =>
	a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })

/**
 * Applies every active filter. Results are alphabetical; with a muscle filter,
 * exercises that train it as a primary muscle come before those that only
 * involve it secondarily. A filter whose data is missing from `context`
 * matches nothing — callers render its loading or error state instead.
 */
export function filterCatalog(
	exercises: readonly Exercise[],
	filters: CatalogFilters,
	context: CatalogContext,
): Exercise[] {
	const q = filters.q.trim().toLocaleLowerCase('en-US')
	const matches = exercises.filter(exercise => {
		if (q && !exercise.name.toLocaleLowerCase('en-US').includes(q)) {
			return false
		}
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
			label: getFriendlyMuscleName(value),
		})),
		equipment: EXERCISE_EQUIPMENT.filter(value => equipment.has(value)).map(
			value => ({ value, label: EQUIPMENT_LABELS[value] }),
		),
		patterns: MOVEMENT_PATTERNS.filter(value => patterns.has(value)).map(
			value => ({ value, label: MOVEMENT_PATTERN_LABELS[value] }),
		),
	}
}

/**
 * The gym filter needs equipment listed at the default location; an empty
 * list is unknown, so filtering by it would hide every exercise.
 */
export function getGymFilterUnavailableState(
	locationName: string | null,
): EmptyStateCopy {
	return {
		title: locationName
			? `${locationName} lists no equipment`
			: 'No training location yet',
		description:
			'List the equipment you train with on your default training location in Settings to filter by it.',
		action: { kind: 'link', label: 'Open Settings', href: '/settings' },
	}
}

export function formatCatalogCount(shown: number, total: number): string {
	const noun = total === 1 ? 'exercise' : 'exercises'
	return shown === total ? `${total} ${noun}` : `${shown} of ${total} ${noun}`
}

/**
 * Why the list is empty. `hasTrainedExercises` is null while the history is
 * unknown; the caller shows loading or error for that case instead.
 */
export function getCatalogEmptyState({
	catalogSize,
	filters,
	hasTrainedExercises,
}: {
	catalogSize: number
	filters: CatalogFilters
	hasTrainedExercises: boolean | null
}): EmptyStateCopy {
	if (catalogSize === 0) {
		return {
			title: 'The catalog is empty',
			description: 'No exercises are available yet.',
		}
	}
	if (filters.trained && hasTrainedExercises === false) {
		return {
			title: 'No trained exercises yet',
			description:
				'Finish a session with at least one completed set and its exercises appear under this filter.',
			action: { kind: 'clear-filters', label: 'Show all exercises' },
		}
	}
	return {
		title: 'No exercises match these filters',
		description: 'Clear them to browse the whole catalog.',
		action: { kind: 'clear-filters', label: 'Clear filters' },
	}
}
