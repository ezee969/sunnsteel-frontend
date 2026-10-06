import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	buildNavigationIndicators,
	communityIndicator,
	notificationsBellLabel,
} from './navigation-indicators'

const en = translatorFor('en', 'shell.indicators')
const es = translatorFor('es', 'shell.indicators')

describe('navigation indicators (NAV-05)', () => {
	it('shows the exact unread count in the label and a restrained compact value', () => {
		expect(
			buildNavigationIndicators(
				{ unreadNotifications: 12, plannedToday: 0, hasActiveSession: false },
				en,
			).notifications,
		).toEqual({
			compactText: '9+',
			accessibleLabel: 'Notifications, 12 unread',
		})
	})

	it('names one or several actionable workouts planned today', () => {
		expect(
			buildNavigationIndicators(
				{ unreadNotifications: 0, plannedToday: 1, hasActiveSession: false },
				en,
			).schedule,
		).toEqual({
			compactText: '1',
			accessibleLabel: 'Schedule, 1 workout planned today',
		})
		expect(
			buildNavigationIndicators(
				{ unreadNotifications: 0, plannedToday: 3, hasActiveSession: false },
				en,
			).schedule?.accessibleLabel,
		).toBe('Schedule, 3 workouts planned today')
	})

	it('says the same in Spanish, singular and plural (I18N-01)', () => {
		const one = buildNavigationIndicators(
			{ unreadNotifications: 4, plannedToday: 1, hasActiveSession: false },
			es,
		)
		expect(one.notifications?.accessibleLabel).toBe(
			'Notificaciones, 4 sin leer',
		)
		expect(one.schedule?.accessibleLabel).toBe(
			'Calendario, 1 entrenamiento planificado para hoy',
		)
		expect(
			buildNavigationIndicators(
				{ unreadNotifications: 0, plannedToday: 2, hasActiveSession: false },
				es,
			).schedule?.accessibleLabel,
		).toBe('Calendario, 2 entrenamientos planificados para hoy')
	})

	it('omits empty states and suppresses the plan while a session is active', () => {
		expect(
			buildNavigationIndicators(
				{ unreadNotifications: -1, plannedToday: 3, hasActiveSession: true },
				en,
			),
		).toEqual({ notifications: null, messages: null, schedule: null })
	})

	it('names the bell, with the unread count when there is one', () => {
		expect(notificationsBellLabel(0, en)).toBe('Notifications')
		expect(notificationsBellLabel(3, en)).toBe('Notifications, 3 unread')
		expect(notificationsBellLabel(0, es)).toBe('Notificaciones')
		expect(notificationsBellLabel(3, es)).toBe('Notificaciones, 3 sin leer')
	})
})

describe('MSG-03 unread conversations', () => {
	const bottomEn = translatorFor('en', 'shell.bottomNav')
	const bottomEs = translatorFor('es', 'shell.bottomNav')

	it('marks the Messages entry with conversations, not messages', () => {
		const indicators = buildNavigationIndicators(
			{
				unreadNotifications: 0,
				unreadConversations: 2,
				plannedToday: 0,
				hasActiveSession: false,
			},
			en,
		)
		expect(indicators.messages).toEqual({
			compactText: '2',
			accessibleLabel: 'Messages, 2 unread conversations',
		})
		expect(indicators.notifications).toBeNull()
		expect(
			buildNavigationIndicators(
				{
					unreadConversations: 1,
					plannedToday: 0,
					hasActiveSession: false,
				},
				es,
			).messages?.accessibleLabel,
		).toBe('Mensajes, 1 conversación sin leer')
	})

	it('shows nothing on Messages when nothing is new', () => {
		expect(
			buildNavigationIndicators(
				{ unreadConversations: 0, plannedToday: 0, hasActiveSession: false },
				en,
			).messages,
		).toBeNull()
	})

	it('never adds conversations to the bell', () => {
		expect(notificationsBellLabel(0, en)).toBe('Notifications')
	})

	it('adds both counts on Community and names each', () => {
		expect(communityIndicator(3, 2, bottomEn)).toEqual({
			count: 5,
			label: 'Community, 3 unread notifications and 2 unread conversations',
		})
		expect(communityIndicator(0, 1, bottomEn)?.label).toBe(
			'Community, 1 unread conversation',
		)
		expect(communityIndicator(4, 0, bottomEn)?.label).toBe(
			'Community, 4 unread notifications',
		)
		expect(communityIndicator(0, 0, bottomEn)).toBeNull()
		expect(communityIndicator(1, 3, bottomEs)?.label).toBe(
			'Comunidad, 1 notificaciones sin leer y 3 conversaciones sin leer',
		)
	})
})
