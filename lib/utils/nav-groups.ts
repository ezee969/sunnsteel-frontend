/**
 * UX-22 (design system §23.8): the four groups the app's destinations sit in,
 * shared by the phone's bottom bar and the sidebar's headings so the two can
 * never disagree about where a page belongs. Ids are the sidebar's item ids
 * (the layout's `getActiveNavFromPath`).
 */
export const NAV_GROUPS = [
	{ id: 'today', items: ['dashboard'] },
	{ id: 'train', items: ['workouts', 'routines', 'schedule'] },
	{ id: 'progress', items: ['progress', 'history', 'achievements'] },
	{
		id: 'community',
		items: ['activity', 'discover-routines', 'messages', 'notifications'],
	},
	{ id: 'more', items: ['exercises', 'moderation', 'settings'] },
] as const

export type NavGroupId = (typeof NAV_GROUPS)[number]['id']

/** Where each bottom-bar group goes when tapped; More opens the drawer. */
export const NAV_GROUP_HREF: Record<Exclude<NavGroupId, 'more'>, string> = {
	today: '/dashboard',
	train: '/workouts',
	progress: '/progress',
	community: '/activity',
}

/**
 * The group a page belongs to. A page with no sidebar entry (a profile, the
 * search page) belongs to More, which is where the drawer that lists
 * everything opens from.
 */
export function navGroupOf(activeNav: string): NavGroupId {
	for (const group of NAV_GROUPS) {
		if ((group.items as readonly string[]).includes(activeNav)) return group.id
	}
	return 'more'
}

/** The sidebar's items in group order, each with the group it opens. */
export function orderByGroup<T extends { id: string }>(
	items: readonly T[],
): { item: T; group: NavGroupId; firstInGroup: boolean }[] {
	const out: { item: T; group: NavGroupId; firstInGroup: boolean }[] = []
	for (const group of NAV_GROUPS) {
		let first = true
		for (const id of group.items) {
			const item = items.find(candidate => candidate.id === id)
			if (!item) continue
			out.push({ item, group: group.id, firstInGroup: first })
			first = false
		}
	}
	return out
}
