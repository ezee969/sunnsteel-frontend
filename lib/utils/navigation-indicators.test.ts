import { describe, expect, it } from 'vitest'

import { buildNavigationIndicators } from './navigation-indicators'

describe('navigation indicators (NAV-05)', () => {
	it('shows the exact unread count in the label and a restrained compact value', () => {
		expect(
			buildNavigationIndicators({
				unreadNotifications: 12,
				plannedToday: 0,
				hasActiveSession: false,
			}).notifications,
		).toEqual({
			compactText: '9+',
			accessibleLabel: 'Notifications, 12 unread',
		})
	})

	it('names one or several actionable workouts planned today', () => {
		expect(
			buildNavigationIndicators({
				unreadNotifications: 0,
				plannedToday: 1,
				hasActiveSession: false,
			}).schedule,
		).toEqual({
			compactText: '1',
			accessibleLabel: 'Schedule, 1 workout planned today',
		})
	})

	it('omits empty states and suppresses the plan while a session is active', () => {
		expect(
			buildNavigationIndicators({
				unreadNotifications: -1,
				plannedToday: 3,
				hasActiveSession: true,
			}),
		).toEqual({ notifications: null, schedule: null })
	})
})
