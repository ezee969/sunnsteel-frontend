import {
	type Exercise,
	normalizeSearchQuery,
	type Routine,
	type WorkoutSessionSummary,
} from '@sunsteel/contracts'

import { fold, matchesExerciseName } from './exercise-catalog'
import type { PageTab } from './page-tabs'

/**
 * NAV-01: the frontend's search rules, pure so they are tested.
 *
 * The server answers members, routines other members shared and the
 * member's own workouts. Exercises and the member's own routines are matched
 * here, over reads the app already caches: the catalog's Spanish names exist
 * only in the message files, and nothing about another member is involved in
 * either list.
 */

export const SEARCH_VIEWS = [
	'all',
	'members',
	'exercises',
	'routines',
	'workouts',
] as const
export type SearchView = (typeof SEARCH_VIEWS)[number]

/** The view a `type` query names; anything else is All. */
export function parseSearchView(type: string | null | undefined): SearchView {
	return (SEARCH_VIEWS as readonly string[]).includes(type ?? '')
		? (type as SearchView)
		: 'all'
}

/** The results page for a query and view. All is the bare query. */
export function searchHref(query: string, view: SearchView = 'all'): string {
	const params = new URLSearchParams({ q: query })
	if (view !== 'all') params.set('type', view)
	return `/search?${params.toString()}`
}

/** The page's tabs (design system §21), in the order the views are shown. */
export function searchTabs(
	query: string,
	label: (view: SearchView) => string,
): PageTab[] {
	return SEARCH_VIEWS.map(view => ({
		href: searchHref(query, view),
		label: label(view),
	}))
}

/** How many of each category the All view shows before "See all". */
export const SEARCH_ALL_VIEW_LIMIT = 4

/**
 * Catalog and own exercises whose stored name or shown label contains the
 * query, in both languages and ignoring accents. A name that starts with the
 * query comes first, then the rest alphabetically by the name shown. An
 * archived exercise of the member's own is still found: its page and its
 * history remain.
 */
export function matchExercises(
	exercises: readonly Exercise[],
	rawQuery: string,
	label: (name: string) => string,
): Exercise[] {
	const query = normalizeSearchQuery(rawQuery)
	if (!query) return []
	const folded = fold(query)
	const starts = (exercise: Exercise) =>
		fold(label(exercise.name)).startsWith(folded) ||
		fold(exercise.name).startsWith(folded)
			? 0
			: 1
	return exercises
		.filter(exercise => matchesExerciseName(exercise.name, query, label))
		.sort(
			(a, b) =>
				starts(a) - starts(b) ||
				label(a.name).localeCompare(label(b.name), undefined, {
					sensitivity: 'base',
				}),
		)
}

/**
 * The member's own routines whose name or description contains the query,
 * ignoring case and accents. Routines in use come before archived ones, and
 * a name that starts with the query before one that only contains it.
 */
export function matchOwnRoutines(
	routines: readonly Routine[],
	rawQuery: string,
): Routine[] {
	const query = normalizeSearchQuery(rawQuery)
	if (!query) return []
	const folded = fold(query)
	const rank = (routine: Routine) =>
		(routine.isCompleted ? 2 : 0) +
		(fold(routine.name).startsWith(folded) ? 0 : 1)
	return routines
		.filter(
			routine =>
				fold(routine.name).includes(folded) ||
				fold(routine.description ?? '').includes(folded),
		)
		.sort(
			(a, b) =>
				rank(a) - rank(b) ||
				a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
		)
}

export const memberHref = (username: string) =>
	`/profile/${encodeURIComponent(username)}`

/** Another member's routine opens on their profile, as `PROF-08` does. */
export const sharedRoutineHref = (username: string, routineId: string) =>
	`/profile/${encodeURIComponent(username)}/routines/${routineId}`

/** A workout still running opens the workout itself; any other its history. */
export const workoutHref = (
	session: Pick<WorkoutSessionSummary, 'id' | 'status'>,
) =>
	session.status === 'IN_PROGRESS'
		? `/workouts/sessions/${session.id}`
		: `/workouts/history/${session.id}`
