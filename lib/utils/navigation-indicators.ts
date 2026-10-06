import type { Translator } from '@/i18n/translator'

export interface NavigationIndicator {
	compactText: string
	accessibleLabel: string
}

export interface NavigationIndicatorInput {
	unreadNotifications?: number
	/** MSG-03: conversations with something new, not messages. */
	unreadConversations?: number
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
export function buildNavigationIndicators(
	{
		unreadNotifications,
		unreadConversations,
		plannedToday,
		hasActiveSession,
	}: NavigationIndicatorInput,
	t: Translator<'shell.indicators'>,
) {
	const unread = positiveCount(unreadNotifications)
	const planned = hasActiveSession ? 0 : positiveCount(plannedToday)
	const conversations = positiveCount(unreadConversations)

	return {
		notifications:
			unread > 0
				? {
						compactText: compactCount(unread),
						accessibleLabel: t('notifications', { count: unread }),
					}
				: null,
		messages:
			conversations > 0
				? {
						compactText: compactCount(conversations),
						accessibleLabel: t('messages', { count: conversations }),
					}
				: null,
		schedule:
			planned > 0
				? {
						compactText: compactCount(planned),
						accessibleLabel: t('schedule', { count: planned }),
					}
				: null,
	} satisfies Record<
		'notifications' | 'messages' | 'schedule',
		NavigationIndicator | null
	>
}

/**
 * MSG-03: the bottom bar's Community group carries both counts on one glyph,
 * so its name says which: unread notifications, unread conversations, or both.
 * The bell never counts messages (owner, 2026-10-06).
 */
export function communityIndicator(
	unreadNotifications: number | undefined,
	unreadConversations: number | undefined,
	t: Translator<'shell.bottomNav'>,
): { count: number; label: string } | null {
	const notifications = positiveCount(unreadNotifications)
	const conversations = positiveCount(unreadConversations)
	if (notifications + conversations === 0) return null
	const label =
		notifications > 0 && conversations > 0
			? t('communityUnreadBoth', { notifications, conversations })
			: notifications > 0
				? t('communityUnread', { count: notifications })
				: t('communityMessages', { count: conversations })
	return { count: notifications + conversations, label }
}

/** NOTIF-01: the top bar bell's accessible name, which carries the count. */
export function notificationsBellLabel(
	unreadCount: number,
	t: Translator<'shell.indicators'>,
) {
	const unread = positiveCount(unreadCount)
	return unread > 0 ? t('notifications', { count: unread }) : t('bell')
}
