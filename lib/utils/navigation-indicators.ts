export interface NavigationIndicator {
	compactText: string
	accessibleLabel: string
}

export interface NavigationIndicatorInput {
	unreadNotifications?: number
	plannedToday: number
	hasActiveSession: boolean
}

const compactCount = (count: number) => (count > 9 ? '9+' : String(count))

const positiveCount = (count: number | undefined) =>
	Math.max(0, Math.floor(count ?? 0))

/**
 * NAV-05: derives the shell's two restrained navigation indicators from reads
 * that already own the underlying truth. A live session suppresses the
 * schedule count because the global Resume banner already carries that state.
 */
export function buildNavigationIndicators({
	unreadNotifications,
	plannedToday,
	hasActiveSession,
}: NavigationIndicatorInput) {
	const unread = positiveCount(unreadNotifications)
	const planned = hasActiveSession ? 0 : positiveCount(plannedToday)

	return {
		notifications:
			unread > 0
				? {
						compactText: compactCount(unread),
						accessibleLabel: `Notifications, ${unread} unread`,
					}
				: null,
		schedule:
			planned > 0
				? {
						compactText: compactCount(planned),
						accessibleLabel: `Schedule, ${planned} ${planned === 1 ? 'workout' : 'workouts'} planned today`,
					}
				: null,
	} satisfies Record<'notifications' | 'schedule', NavigationIndicator | null>
}
