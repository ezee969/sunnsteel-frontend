import type {
	ExercisePerformanceSummary,
	StarredExercisesResponse,
} from '@sunsteel/contracts'

import type { Exercise } from '@/lib/api/types/exercise.type'

/**
 * EXER-07: starred and recently trained exercises come first in the routine
 * wizard's pickers. Pure, so the ordering runs in the Node test environment.
 */

export const RECENT_EXERCISES_LIMIT = 5

export type PickerGroupKey = 'starred' | 'recent' | 'other'

export interface PickerGroup {
	key: PickerGroupKey
	label: string
	exercises: Exercise[]
	/** The recent group while training history loads: shown, but empty. */
	pending?: boolean
}

/**
 * Starred exercises (newest star first), then up to five recently trained
 * ones that are not starred, then everything else in catalog order. Each
 * exercise appears once and empty groups are omitted; with no starred or
 * recent exercises the single group is labelled "All exercises". While the
 * history is still loading (`recentPending`), the recent group is kept as an
 * empty pending placeholder so its arrival reads as loading, not a jump.
 */
export function groupPickerExercises(
	exercises: readonly Exercise[],
	{
		starred = [],
		recent = [],
		recentPending = false,
		exclude,
	}: {
		starred?: readonly string[]
		recent?: readonly Pick<
			ExercisePerformanceSummary,
			'exerciseId' | 'lastPerformedAt'
		>[]
		recentPending?: boolean
		exclude?: ReadonlySet<string>
	},
): PickerGroup[] {
	const byId = new Map(exercises.map(exercise => [exercise.id, exercise]))
	const placed = new Set<string>(exclude)
	const take = (id: string) => {
		const exercise = byId.get(id)
		if (!exercise || placed.has(id)) return []
		placed.add(id)
		return [exercise]
	}

	const starredGroup = starred.flatMap(take)
	const recentGroup = [...recent]
		.sort((a, b) => b.lastPerformedAt.localeCompare(a.lastPerformedAt))
		.flatMap(item => take(item.exerciseId))
		.slice(0, RECENT_EXERCISES_LIMIT)
	// `take` marked every recent candidate, including ones past the limit.
	const shown = new Set([
		...(exclude ?? []),
		...starredGroup.map(exercise => exercise.id),
		...recentGroup.map(exercise => exercise.id),
	])
	const other = exercises.filter(exercise => !shown.has(exercise.id))

	const prioritized =
		recentPending || starredGroup.length + recentGroup.length > 0
	const groups: PickerGroup[] = [
		{ key: 'starred', label: 'Starred', exercises: starredGroup },
		recentPending
			? {
					key: 'recent',
					label: 'Recently trained',
					exercises: [],
					pending: true,
				}
			: { key: 'recent', label: 'Recently trained', exercises: recentGroup },
		{
			key: 'other',
			label: prioritized ? 'Other exercises' : 'All exercises',
			exercises: other,
		},
	]
	return groups.filter(group => group.pending || group.exercises.length > 0)
}

/** The optimistic cache value while a star or unstar request is in flight. */
export function applyStarChange(
	current: StarredExercisesResponse | undefined,
	exerciseId: string,
	starred: boolean,
	now: string,
): StarredExercisesResponse {
	const items = (current?.items ?? []).filter(
		item => item.exerciseId !== exerciseId,
	)
	return {
		items: starred ? [{ exerciseId, starredAt: now }, ...items] : items,
	}
}
