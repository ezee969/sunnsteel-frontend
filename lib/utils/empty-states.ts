import type { Translator } from '@/i18n/translator'

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
	t: Translator<'planning.emptyStates'>,
): EmptyStateCopy {
	return hasActiveFilters
		? {
				title: t('historyFilteredTitle'),
				description: t('historyFilteredDescription'),
				action: { kind: 'clear-filters', label: t('clearFilters') },
			}
		: {
				title: t('historyEmptyTitle'),
				description: t('historyEmptyDescription'),
				action: {
					kind: 'link',
					label: t('chooseRoutine'),
					href: '/routines',
				},
			}
}

export function getRecentActivityEmptyState(
	hasRoutines: boolean,
	t: Translator<'planning.emptyStates'>,
): EmptyStateCopy {
	return hasRoutines
		? {
				title: t('recentNoFinishedTitle'),
				description: t('recentNoFinishedDescription'),
				action: {
					kind: 'link',
					label: t('browseRoutines'),
					href: '/routines',
				},
			}
		: {
				title: t('recentNoRoutinesTitle'),
				description: t('recentNoRoutinesDescription'),
				action: {
					kind: 'link',
					label: t('createRoutine'),
					href: '/routines/new',
				},
			}
}

// No button of its own: the adjacent Recent Activity module and the primary
// card above already carry the same action, and repeating it is noise.
export function getPersonalRecordsEmptyState(
	t: Translator<'planning.emptyStates'>,
): EmptyStateCopy {
	return {
		title: t('recordsTitle'),
		description: t('recordsDescription'),
	}
}
