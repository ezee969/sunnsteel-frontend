import type { ActivityEntry } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { describeEmptyFeed } from './activity'
import {
	buildFollowingPreview,
	describeMoreFacts,
	FOLLOWING_PREVIEW_FACTS_PER_ROW,
	FOLLOWING_PREVIEW_ROWS,
	getFollowingPreviewEmptyState,
} from './dashboard-following'

const lee: ActivityEntry['author'] = {
	username: 'lee',
	name: 'Lee',
	lastName: 'Ray',
	avatarUrl: null,
}
const ana: ActivityEntry['author'] = {
	username: 'ana',
	name: 'Ana',
	lastName: null,
	avatarUrl: null,
}

const entry = (
	id: string,
	groupKey: string | null,
	author = lee,
): ActivityEntry => ({
	id,
	groupKey,
	author,
	occurredAt: '2026-09-23T10:00:00.000Z',
	link: null,
	reactions: {
		counts: { STRENGTH: 0, DISCIPLINE: 0, RESPECT: 0, INSPIRING: 0 },
		viewerReaction: null,
	},
	comments: { count: 0, canComment: true },
	type: 'PERSONAL_RECORD',
	record: {
		exerciseId: 'bench',
		exerciseName: 'Bench Press',
		weightKg: 100,
		reps: 5,
		estimated1rmKg: 116.67,
	},
})

const ids = (rows: ReturnType<typeof buildFollowingPreview>) =>
	rows.map(row => row.entries.map(item => item.id))

describe('the dashboard following preview is a bounded slice of the feed', () => {
	it('shows at most three rows, newest first, in the feed order', () => {
		const feed = ['a', 'b', 'c', 'd', 'e'].map(id => entry(id, null))
		const rows = buildFollowingPreview(feed)
		expect(FOLLOWING_PREVIEW_ROWS).toBe(3)
		expect(ids(rows)).toEqual([['a'], ['b'], ['c']])
	})

	it('keeps a workout together under the same rule as the feed', () => {
		const feed = [
			entry('s1', 'w1'),
			entry('x', null, ana),
			entry('r1', 'w1'),
			entry('y', null, ana),
		]
		expect(ids(buildFollowingPreview(feed))).toEqual([
			['s1', 'r1'],
			['x'],
			['y'],
		])
	})

	it('caps the facts of one workout and counts the rest', () => {
		const feed = ['s', 'r1', 'r2', 'r3'].map(id => entry(id, 'w'))
		const [row] = buildFollowingPreview(feed)
		expect(FOLLOWING_PREVIEW_FACTS_PER_ROW).toBe(2)
		expect(row.entries.map(item => item.id)).toEqual(['s', 'r1'])
		expect(row.moreCount).toBe(2)
		expect(describeMoreFacts(row.moreCount)).toBe(
			'and 2 more from this workout',
		)
	})

	it('counts nothing more when a row fits', () => {
		const [row] = buildFollowingPreview([entry('s', 'w'), entry('r', 'w')])
		expect(row.moreCount).toBe(0)
	})

	it('shows nothing when the feed is empty', () => {
		expect(buildFollowingPreview([])).toEqual([])
	})
})

describe('the preview empty states are the feed empty states', () => {
	it('offers finding members to someone who follows nobody', () => {
		expect(getFollowingPreviewEmptyState(0)).toEqual({
			...describeEmptyFeed(0),
			action: { kind: 'link', href: '/search', label: 'Find members' },
		})
	})

	it('offers nothing when the members followed share nothing', () => {
		const state = getFollowingPreviewEmptyState(4)
		expect(state).toEqual(describeEmptyFeed(4))
		expect(state.action).toBeUndefined()
		expect(state.description).toContain('Everyone starts private')
	})
})
