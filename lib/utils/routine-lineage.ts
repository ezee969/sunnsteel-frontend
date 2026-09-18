import type { RoutineLineage } from '@sunsteel/contracts'

/**
 * ROUT-06 copy. A clone always says it is one; what it may say about the
 * source depends on whether the viewer could read that source anyway, which
 * the server has already decided.
 */

export function describeLineageAuthor(lineage: RoutineLineage): string | null {
	if (!lineage.author) return null
	const { name, lastName, username } = lineage.author
	return [name, lastName].filter(Boolean).join(' ') || `@${username}`
}

/**
 * The sentence under a cloned routine. A hidden source is stated as hidden
 * rather than omitted: the routine is still a copy, and saying nothing would
 * quietly present somebody else's programme as original work.
 */
export function describeRoutineLineage(lineage: RoutineLineage): string {
	const author = describeLineageAuthor(lineage)
	if (lineage.isSourceHidden || !author) {
		return 'Cloned from another member’s routine. The original is no longer available to you.'
	}
	return `Cloned from ${author}’s routine.`
}

/** Where the source opens, when this viewer may open it at all. */
export function lineageSourceHref(lineage: RoutineLineage): string | null {
	if (lineage.isSourceHidden || !lineage.sourceRoutineId || !lineage.author) {
		return null
	}
	return `/profile/${encodeURIComponent(lineage.author.username)}/routines/${encodeURIComponent(lineage.sourceRoutineId)}`
}
