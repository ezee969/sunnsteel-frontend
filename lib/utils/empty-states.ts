/**
 * DASH-10: an empty module names the most useful next step instead of only
 * saying that nothing is there. Copy lives here so every state is testable.
 */
export type EmptyStateAction =
	| { kind: 'link'; label: string; href: string }
	| { kind: 'clear-filters'; label: string }

export interface EmptyStateCopy {
	title: string
	description: string
	action?: EmptyStateAction
}

type HistoryFilterState = {
	status?: string
	routineId?: string
	from?: string
	to?: string
	q?: string
}

/** Sort order changes what comes first, never which sessions exist. */
export function hasActiveHistoryFilters(filters: HistoryFilterState): boolean {
	return Boolean(
		filters.status ||
		filters.routineId ||
		filters.from ||
		filters.to ||
		filters.q?.trim(),
	)
}

export function getHistoryEmptyState(
	hasActiveFilters: boolean,
): EmptyStateCopy {
	return hasActiveFilters
		? {
				title: 'No sessions match these filters',
				description: 'Clear them to see your whole training archive.',
				action: { kind: 'clear-filters', label: 'Clear filters' },
			}
		: {
				title: 'No workouts logged yet',
				description:
					'Finish a session and it is archived here with its sets, volume and notes.',
				action: { kind: 'link', label: 'Choose a routine', href: '/routines' },
			}
}

export function getRecentActivityEmptyState(
	hasRoutines: boolean,
): EmptyStateCopy {
	return hasRoutines
		? {
				title: 'No finished workouts yet',
				description:
					'Start a workout from any routine and it will appear here with its volume and duration.',
				action: { kind: 'link', label: 'Browse routines', href: '/routines' },
			}
		: {
				title: 'No routines yet',
				description:
					'Start from a template or build your own to plan your training and start logging workouts.',
				action: {
					kind: 'link',
					label: 'Create routine',
					href: '/routines/new',
				},
			}
}

// No button of its own: the adjacent Recent Activity module and the primary
// card above already carry the same action, and repeating it is noise.
export const PERSONAL_RECORDS_EMPTY_STATE: EmptyStateCopy = {
	title: 'No records yet',
	description:
		'Complete a set in any workout and your best lift for each exercise is recorded here.',
}
