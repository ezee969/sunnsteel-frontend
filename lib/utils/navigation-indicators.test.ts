import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import { buildNavigationIndicators } from './navigation-indicators'

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
		).toEqual({ notifications: null, schedule: null })
	})
})
