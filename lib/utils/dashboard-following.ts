import type { ActivityEntry, SharedRoutineOwner } from '@sunsteel/contracts'

import { describeEmptyFeed, groupActivity } from './activity'
import type { EmptyStateCopy } from './empty-states'

/**
 * DASH-08 places the `SOC-03` feed on the dashboard and gathers nothing of its
 * own: the entries are the feed's, already filtered by the server under the
 * `SOC-04` audiences, and grouped by the same `groupActivity` rule. The
 * dashboard only decides how much of it to show, so it stays a preview beside
 * the training actions rather than a second feed.
 */
export const FOLLOWING_PREVIEW_ROWS = 3

/** A workout can carry a session and several records; the rest is on /activity. */
export const FOLLOWING_PREVIEW_FACTS_PER_ROW = 2

export interface FollowingPreviewRow {
	key: string
	author: SharedRoutineOwner
	/** The facts shown, newest group first, in the feed's own order. */
	entries: ActivityEntry[]
	/** Facts of the same workout left for the Activity page. */
	moreCount: number
}

export function buildFollowingPreview(
	entries: ActivityEntry[],
	rows = FOLLOWING_PREVIEW_ROWS,
	factsPerRow = FOLLOWING_PREVIEW_FACTS_PER_ROW,
): FollowingPreviewRow[] {
	return groupActivity(entries)
		.slice(0, rows)
		.map(group => ({
			key: group.key,
			author: group.author,
			entries: group.entries.slice(0, factsPerRow),
			moreCount: Math.max(0, group.entries.length - factsPerRow),
		}))
}

/** Only a workout groups several facts, so the remainder is named as its. */
export function describeMoreFacts(count: number): string {
	return `and ${count.toLocaleString()} more from this workout`
}

/**
 * The feed's own empty copy, so the two surfaces never disagree about why
 * nothing is there. Following nobody offers the way to change that; following
 * members who share nothing offers nothing, because the choice is theirs.
 */
export function getFollowingPreviewEmptyState(
	followedCount: number,
): EmptyStateCopy {
	return {
		...describeEmptyFeed(followedCount),
		...(followedCount === 0
			? {
					action: {
						kind: 'link' as const,
						href: '/search',
						label: 'Find members',
					},
				}
			: {}),
	}
}
