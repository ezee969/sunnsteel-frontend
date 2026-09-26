import { normalizeExerciseLinks } from '@sunsteel/contracts'

/**
 * ROUT-12: a superset or circuit is stored as each member's link to the next
 * exercise of the day, so a reorder or a removal has to decide which links
 * still stand. Pure, so it runs in the Node test environment.
 */

type Linkable = { linkedToNext?: boolean }

/**
 * The links of `next`, a reorder or a removal of `previous` (the same objects).
 * A link stands only while its two exercises are still side by side in the
 * same order; when an exercise leaves the middle of a group, the one before
 * it stays linked to the one after it, so the rest of the group holds. The
 * day's last exercise never links.
 */
export function linksAfterReorder<T extends Linkable>(
	previous: readonly T[],
	next: readonly T[],
): boolean[] {
	const after = new Map<T, T | undefined>(
		previous.map((exercise, index) => [exercise, previous[index + 1]]),
	)
	const links = next.map((exercise, index) => {
		if (!exercise.linkedToNext) return false
		const neighbour = next[index + 1]
		if (!neighbour) return false
		const was = after.get(exercise)
		if (was === neighbour) return true
		// Bridging: `was` left from between this exercise and `neighbour`.
		return Boolean(was?.linkedToNext && after.get(was) === neighbour)
	})
	return normalizeExerciseLinks(
		links.map(linkedToNext => ({ linkedToNext })),
	).map(link => Boolean(link.linkedToNext))
}

/** A copy of `exercises` carrying `links`, for plain (non-draft) data. */
export const withLinks = <T extends Linkable>(
	exercises: readonly T[],
	links: readonly boolean[],
): T[] =>
	exercises.map((exercise, index) =>
		Boolean(exercise.linkedToNext) === links[index]
			? exercise
			: { ...exercise, linkedToNext: links[index] },
	)
