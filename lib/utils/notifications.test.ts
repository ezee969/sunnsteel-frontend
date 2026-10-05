import type {
	AppNotification,
	NotificationsResponse,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	describeNotification,
	EARLIER_NOTIFICATIONS_SHOWN,
	flattenNotificationPages,
	markReadInCache,
	markReadInPages,
	NEW_NOTIFICATIONS_SHOWN,
	sessionProgressSummary,
	splitByRead,
	withUnreadCount,
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

const encouragement: AppNotification = {
	...base,
	id: 'n4',
	kind: 'TRAINING_PARTNER_ENCOURAGEMENT',
	actor: {
		id: 'u3',
		username: 'cassia',
		name: 'Cassia',
		lastName: null,
		avatarUrl: null,
	},
	encouragement: { kind: 'GOOD_WORK' },
}

const partnerSession: AppNotification = {
	...base,
	id: 'n5',
	kind: 'TRAINING_PARTNER_SESSION',
	actor: {
		id: 'u3',
		username: 'cassia',
		name: 'Cassia',
		lastName: 'Stone',
		avatarUrl: null,
	},
	entryId: 'session:s2:completed:v1',
	session: {
		id: 's2',
		routineName: 'Upper / Lower',
		dayName: 'Lower',
	},
}

const partnerAchievement: AppNotification = {
	...base,
	id: 'n6',
	kind: 'TRAINING_PARTNER_ACHIEVEMENT',
	actor: {
		id: 'u3',
		username: 'cassia',
		name: 'Cassia',
		lastName: null,
		avatarUrl: null,
	},
	entryId: 'achievement:u3:sessions-10:v1',
	achievement: { id: 'sessions-10', title: 'Ten sessions' },
}

const t = translatorFor('en', 'social.notifications')
const es = translatorFor('es', 'social.notifications')
const tPartners = translatorFor('en', 'settings.trainingPartners')
const esPartners = translatorFor('es', 'settings.trainingPartners')

describe('notifications (NOTIF-01)', () => {
	it('names what each notification announces and where it leads', () => {
		expect(describeNotification(achievement, t, tPartners)).toEqual({
			title: 'Achievement earned: 10 Sessions',
			detail: 'Complete 10 sessions.',
			href: '/achievements',
		})
		expect(describeNotification(progress, t, tPartners)).toEqual({
			title: 'Upper / Lower · Upper: 2 new records and 1 load change',
			detail: 'Load changes apply from your next session of this day.',
			href: '/workouts/history/s1',
		})
		expect(describeNotification(follower, t, tPartners)).toEqual({
			title: 'Marta Ruiz started following you',
			detail: '@marta · open their profile to follow back',
			href: '/profile/marta',
		})
		expect(
			describeNotification(
				{
					...follower,
					actor: { ...follower.actor, lastName: null, isFollowedByMe: true },
				} as AppNotification,
				t,
				tPartners,
			).detail,
		).toBe('@marta · you follow them too')
		expect(describeNotification(encouragement, t, tPartners)).toEqual({
			title: 'Cassia sent encouragement: Good work',
			detail: '@cassia · from your training partner',
			href: '/profile/cassia',
		})
		expect(describeNotification(partnerSession, t, tPartners)).toEqual({
			title: 'Cassia Stone completed a workout',
			detail: 'Upper / Lower · Lower · shared by your training partner',
			href: '/profile/cassia',
		})
		expect(describeNotification(partnerAchievement, t, tPartners)).toEqual({
			title: 'Cassia earned Ten sessions',
			detail: '@cassia · shared by your training partner',
			href: '/profile/cassia',
		})
	})

	it('names a finished block, its reference and estimate in the member’s unit and language (ROUT-18)', () => {
		const finished: AppNotification = {
			...base,
			id: 'n9',
			kind: 'LINEAR_BLOCK_FINISHED',
			routine: { id: 'r1', name: 'Strength' },
			exercise: { id: 'bench', name: 'Bench Press' },
			sessionId: 's9',
			referenceMaxKg: 100,
			estimatedMaxKg: 102.5,
		}
		expect(
			describeNotification(finished, t, tPartners, undefined, {
				weightUnit: 'KG',
				locale: 'en',
				tExercises: translatorFor('en', 'catalog.exercises'),
			}),
		).toEqual({
			title: 'Block finished: Bench Press',
			detail: 'Reference 100 kg · estimated 1RM 102.5 kg',
			href: '/routines/r1',
		})
		expect(
			describeNotification(finished, es, esPartners, undefined, {
				weightUnit: 'KG',
				locale: 'es',
				tExercises: translatorFor('es', 'catalog.exercises'),
			}),
		).toEqual({
			title: 'Bloque terminado: Press de banca',
			detail: 'Referencia 100 kg · 1RM estimado 102,5 kg',
			href: '/routines/r1',
		})
		expect(
			describeNotification(
				{ ...finished, estimatedMaxKg: null },
				t,
				tPartners,
				undefined,
				{ weightUnit: 'LB', locale: 'en' },
			).detail,
		).toBe('Reference 220.46 lb · not enough sets to estimate a new 1RM')
		expect(
			describeNotification(
				{ ...finished, estimatedMaxKg: null },
				es,
				esPartners,
				undefined,
				{ weightUnit: 'KG', locale: 'es' },
			).detail,
		).toBe(
			'Referencia 100 kg · no hay suficientes series para estimar un nuevo 1RM',
		)
	})

	it('counts records and load changes in plain words', () => {
		expect(sessionProgressSummary(1, 0, t)).toBe('1 new record')
		expect(sessionProgressSummary(0, 3, t)).toBe('3 load changes')
		expect(sessionProgressSummary(2, 2, t)).toBe(
			'2 new records and 2 load changes',
		)
		expect(sessionProgressSummary(1, 0, es)).toBe('1 récord nuevo')
		expect(sessionProgressSummary(2, 1, es)).toBe(
			'2 récords nuevos y 1 cambio de carga',
		)
		expect(describeNotification(follower, es, esPartners).title).toBe(
			'Marta Ruiz empezó a seguirte',
		)
	})

	it('marks read in the cache the way the server will', () => {
		const data: NotificationsResponse = {
			notifications: [
				achievement,
				progress,
				{ ...follower, readAt: '2026-09-13T08:00:00.000Z' },
			],
			unreadCount: 2,
			nextCursor: null,
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

describe('notification pages (NOTIF-09)', () => {
	const now = new Date('2026-09-15T12:00:00.000Z')
	const page = (
		notifications: AppNotification[],
		unreadCount: number,
		nextCursor: string | null,
	): NotificationsResponse => ({ notifications, unreadCount, nextCursor })
	// The account has five unread; two of them are loaded, one on each page.
	const pages = {
		pages: [
			page([achievement, { ...progress, readAt: now.toISOString() }], 5, 'c1'),
			page([{ ...follower, id: 'n4' }], 5, null),
		],
		pageParams: [null, 'c1'],
	}

	it('reads the loaded pages as one list with the account count and the last cursor', () => {
		const flat = flattenNotificationPages(pages)
		expect(flat.notifications.map(n => n.id)).toEqual(['n1', 'n2', 'n4'])
		expect(flat.unreadCount).toBe(5)
		expect(flat.nextCursor).toBeNull()
		expect(
			flattenNotificationPages({ pages: [pages.pages[0]], pageParams: [null] })
				.nextCursor,
		).toBe('c1')
	})

	it('shows a row a refetch moved across a page boundary once', () => {
		const moved = {
			pages: [pages.pages[0], page([achievement], 5, null)],
			pageParams: [null, 'c1'],
		}
		expect(flattenNotificationPages(moved).notifications).toHaveLength(2)
	})

	it('marks read across every page and lowers the count by what it marked', () => {
		const one = markReadInPages(pages, ['n4'], now)
		expect(one.pages.map(p => p.unreadCount)).toEqual([4, 4])
		expect(one.pages[1].notifications[0].readAt).toBe(now.toISOString())
		expect(one.pages[0].notifications[0].readAt).toBeNull()
		expect(one.pageParams).toEqual(pages.pageParams)

		const all = markReadInPages(pages, undefined, now)
		expect(all.pages.map(p => p.unreadCount)).toEqual([0, 0])
		expect(all.pages.every(p => p.notifications.every(n => n.readAt))).toBe(
			true,
		)
	})

	it('gives every page the count the server answered', () => {
		expect(withUnreadCount(pages, 2).pages.map(p => p.unreadCount)).toEqual([
			2, 2,
		])
	})
})

describe('splitting updates into new and earlier (UX-09)', () => {
	it('keeps every unread update and the server order in each group', () => {
		const list: AppNotification[] = [
			{ ...achievement, id: 'a' },
			{ ...achievement, id: 'b', readAt: '2026-09-15T10:00:00.000Z' },
			{ ...achievement, id: 'c' },
			{ ...achievement, id: 'd', readAt: '2026-09-15T11:00:00.000Z' },
		]
		const { unread, read } = splitByRead(list)
		expect(unread.map(n => n.id)).toEqual(['a', 'c'])
		expect(read.map(n => n.id)).toEqual(['b', 'd'])
	})

	it('shows a few of each group before asking', () => {
		expect(NEW_NOTIFICATIONS_SHOWN).toBeGreaterThan(0)
		expect(EARLIER_NOTIFICATIONS_SHOWN).toBeGreaterThan(0)
	})
})

describe('notifications name achievements in the viewer language (I18N-07)', () => {
	const note: AppNotification = {
		...base,
		id: 'n-ach',
		kind: 'ACHIEVEMENT',
		achievement: {
			id: 'sessions:10',
			title: '10 Sessions',
			description: 'Complete 10 sessions.',
		},
	}

	it('reads the catalog text by id and passes unknown ids through', () => {
		const spanish = describeNotification(
			note,
			es,
			esPartners,
			translatorFor('es', 'catalog.achievements'),
		)
		expect(spanish.title).toContain('10 sesiones')
		expect(spanish.detail).toBe('Completa 10 sesiones de entrenamiento.')
		const en = describeNotification(
			achievement,
			t,
			tPartners,
			translatorFor('en', 'catalog.achievements'),
		)
		expect(en.title).toBe('Achievement earned: 10 Sessions')
	})
})
