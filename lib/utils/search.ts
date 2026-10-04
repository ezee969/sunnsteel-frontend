import {
	type Exercise,
	normalizeSearchQuery,
	type RecentRoutine,
	type RecentSearchItem,
	type RecentSearchKind,
	type Routine,
	type SharedRoutineSearchResult,
	type UserSearchResponse,
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

// NAV-02: the header's grouped suggestions ---------------------------------

/** How many of each category the header's suggestions show. */
export const SEARCH_SUGGESTION_LIMIT = 3

export type SuggestionEntry =
	| { kind: 'member'; key: string; href: string; member: UserSearchResponse }
	| {
			kind: 'exercise'
			key: string
			href: string
			exercise: Pick<Exercise, 'id' | 'name' | 'isCustom' | 'archivedAt'>
	  }
	| { kind: 'routine'; key: string; href: string; routine: Routine }
	| {
			kind: 'sharedRoutine'
			key: string
			href: string
			routine: SharedRoutineSearchResult
	  }
	| {
			kind: 'workout'
			key: string
			href: string
			session: WorkoutSessionSummary
	  }
	| {
			/** NAV-03: a routine as the recent list resolves it, own or shared. */
			kind: 'recentRoutine'
			key: string
			href: string
			routine: RecentRoutine
	  }

export interface SuggestionGroup {
	view: Exclude<SearchView, 'all'>
	entries: SuggestionEntry[]
}

/**
 * The suggestion groups in the results page's order, each at most `limit`
 * long and left out when empty. Routines are the member's own first, then
 * those other members shared, within the one limit.
 */
export function suggestionGroups(
	found: {
		members?: readonly UserSearchResponse[]
		exercises?: readonly Exercise[]
		ownRoutines?: readonly Routine[]
		sharedRoutines?: readonly SharedRoutineSearchResult[]
		workouts?: readonly WorkoutSessionSummary[]
	},
	limit = SEARCH_SUGGESTION_LIMIT,
): SuggestionGroup[] {
	const groups: SuggestionGroup[] = [
		{
			view: 'members',
			entries: (found.members ?? []).map(member => ({
				kind: 'member' as const,
				key: `member:${member.id}`,
				href: memberHref(member.username),
				member,
			})),
		},
		{
			view: 'exercises',
			entries: (found.exercises ?? []).map(exercise => ({
				kind: 'exercise' as const,
				key: `exercise:${exercise.id}`,
				href: `/exercises/${exercise.id}`,
				exercise,
			})),
		},
		{
			view: 'routines',
			entries: [
				...(found.ownRoutines ?? []).map(routine => ({
					kind: 'routine' as const,
					key: `routine:${routine.id}`,
					href: `/routines/${routine.id}`,
					routine,
				})),
				...(found.sharedRoutines ?? []).map(routine => ({
					kind: 'sharedRoutine' as const,
					key: `shared:${routine.routineId}`,
					href: sharedRoutineHref(routine.author.username, routine.routineId),
					routine,
				})),
			],
		},
		{
			view: 'workouts',
			entries: (found.workouts ?? []).map(session => ({
				kind: 'workout' as const,
				key: `workout:${session.id}`,
				href: workoutHref(session),
				session,
			})),
		},
	]
	return groups
		.map(group => ({ ...group, entries: group.entries.slice(0, limit) }))
		.filter(group => group.entries.length > 0)
}

/**
 * The option the arrow keys land on in a list of `total`, where -1 is "none
 * yet" (the field itself). Down from none is the first, up from none the
 * last, and both ends wrap, as a combobox's list does.
 */
export function moveActive(
	current: number,
	total: number,
	step: 1 | -1,
): number {
	if (total <= 0) return -1
	if (current < 0) return step === 1 ? 0 : total - 1
	return (current + step + total) % total
}

// NAV-03: recent searches -----------------------------------------------

/** What to record when a suggestion or result opens. */
export function recentTarget(entry: SuggestionEntry): {
	kind: RecentSearchKind
	targetId: string
} {
	switch (entry.kind) {
		case 'member':
			return { kind: 'MEMBER', targetId: entry.member.id }
		case 'exercise':
			return { kind: 'EXERCISE', targetId: entry.exercise.id }
		case 'routine':
			return { kind: 'ROUTINE', targetId: entry.routine.id }
		case 'sharedRoutine':
		case 'recentRoutine':
			return { kind: 'ROUTINE', targetId: entry.routine.routineId }
		case 'workout':
			return { kind: 'WORKOUT', targetId: entry.session.id }
	}
}

/**
 * The recent list as suggestion entries, in the server's order (newest
 * first), each opening where the same result opens from search. A routine
 * with no author is the member's own and opens its own page.
 */
export function recentEntries(
	items: readonly RecentSearchItem[],
): SuggestionEntry[] {
	return items.map(item => {
		switch (item.kind) {
			case 'MEMBER':
				return {
					kind: 'member',
					key: `member:${item.member.id}`,
					href: memberHref(item.member.username),
					member: item.member,
				}
			case 'EXERCISE':
				return {
					kind: 'exercise',
					key: `exercise:${item.exercise.id}`,
					href: `/exercises/${item.exercise.id}`,
					exercise: item.exercise,
				}
			case 'ROUTINE':
				return {
					kind: 'recentRoutine',
					key: `routine:${item.routine.routineId}`,
					href: item.routine.author
						? sharedRoutineHref(
								item.routine.author.username,
								item.routine.routineId,
							)
						: `/routines/${item.routine.routineId}`,
					routine: item.routine,
				}
			case 'WORKOUT':
				return {
					kind: 'workout',
					key: `workout:${item.session.id}`,
					href: workoutHref(item.session),
					session: item.session,
				}
		}
	})
}
