import type {
	AppNotification,
	NotificationsResponse,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	describeNotification,
	markReadInCache,
	notificationsBellLabel,
	sessionProgressSummary,
} from './notifications'

const base = { createdAt: '2026-09-14T19:00:00.000Z', readAt: null }

const achievement: AppNotification = {
	...base,
	id: 'n1',
	kind: 'ACHIEVEMENT',
	achievement: {
		id: 'sessions-10',
		title: '10 Sessions',
		description: 'Complete 10 sessions.',
	},
}

const progress: AppNotification = {
	...base,
	id: 'n2',
	kind: 'SESSION_PROGRESS',
	session: {
		id: 's1',
		routineName: 'Upper / Lower',
		dayName: 'Upper',
		recordCount: 2,
		progressionCount: 1,
	},
}

const follower: AppNotification = {
	...base,
	id: 'n3',
	kind: 'NEW_FOLLOWER',
	actor: {
		id: 'u2',
		username: 'marta',
		name: 'Marta',
		lastName: 'Ruiz',
		avatarUrl: null,
		isFollowedByMe: false,
	},
}

describe('notifications (NOTIF-01)', () => {
	it('names what each notification announces and where it leads', () => {
		expect(describeNotification(achievement)).toEqual({
			title: 'Achievement earned: 10 Sessions',
			detail: 'Complete 10 sessions.',
			href: '/achievements',
		})
		expect(describeNotification(progress)).toEqual({
			title: 'Upper / Lower · Upper: 2 new records and 1 load change',
			detail: 'Load changes apply from your next session of this day.',
			href: '/workouts/history/s1',
		})
		expect(describeNotification(follower)).toEqual({
			title: 'Marta Ruiz started following you',
			detail: '@marta · open their profile to follow back',
			href: '/profile/marta',
		})
		expect(
			describeNotification({
				...follower,
				actor: { ...follower.actor, lastName: null, isFollowedByMe: true },
			} as AppNotification).detail,
		).toBe('@marta · you follow them too')
	})

	it('counts records and load changes in plain words', () => {
		expect(sessionProgressSummary(1, 0)).toBe('1 new record')
		expect(sessionProgressSummary(0, 3)).toBe('3 load changes')
		expect(sessionProgressSummary(2, 2)).toBe(
			'2 new records and 2 load changes',
		)
		expect(notificationsBellLabel(0)).toBe('Notifications')
		expect(notificationsBellLabel(3)).toBe('Notifications, 3 unread')
	})

	it('marks read in the cache the way the server will', () => {
		const data: NotificationsResponse = {
			notifications: [
				achievement,
				progress,
				{ ...follower, readAt: '2026-09-13T08:00:00.000Z' },
			],
			unreadCount: 2,
		}
		const now = new Date('2026-09-15T12:00:00.000Z')
		const one = markReadInCache(data, ['n1', 'n3'], now)
		expect(one.unreadCount).toBe(1)
		expect(one.notifications.map(n => n.readAt)).toEqual([
			'2026-09-15T12:00:00.000Z',
			null,
			'2026-09-13T08:00:00.000Z',
		])
		const all = markReadInCache(data, undefined, now)
		expect(all.unreadCount).toBe(0)
		expect(all.notifications.every(n => n.readAt)).toBe(true)
	})
})
