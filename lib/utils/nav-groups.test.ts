import { describe, expect, it } from 'vitest'

import { NAV_GROUPS, navGroupOf, orderByGroup } from './nav-groups'

describe('navigation groups (UX-22)', () => {
	it('puts every page in the group the owner chose', () => {
		expect(navGroupOf('dashboard')).toBe('today')
		for (const id of ['workouts', 'routines', 'schedule'])
			expect(navGroupOf(id)).toBe('train')
		for (const id of ['progress', 'history', 'achievements'])
			expect(navGroupOf(id)).toBe('progress')
		for (const id of ['activity', 'discover-routines', 'notifications'])
			expect(navGroupOf(id)).toBe('community')
		for (const id of ['exercises', 'moderation', 'settings'])
			expect(navGroupOf(id)).toBe('more')
	})

	it('sends a page with no entry, such as a profile, to More', () => {
		expect(navGroupOf('')).toBe('more')
	})

	it('lists no page in two groups', () => {
		const ids = NAV_GROUPS.flatMap(group => [...group.items])
		expect(new Set(ids).size).toBe(ids.length)
	})

	it('orders items by group and marks the first of each', () => {
		const items = ['notifications', 'dashboard', 'routines', 'workouts'].map(
			id => ({ id }),
		)
		expect(
			orderByGroup(items).map(
				row => `${row.item.id}:${row.group}:${row.firstInGroup}`,
			),
		).toEqual([
			'dashboard:today:true',
			'workouts:train:true',
			'routines:train:false',
			'notifications:community:true',
		])
	})
})
