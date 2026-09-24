import type {
	AppNotification,
	NotificationsResponse,
} from '@sunsteel/contracts'

import { trainingPartnerEncouragementLabel } from './training-partners'

export interface NotificationView {
	title: string
	detail: string | null
	href: string
}

const count = (n: number, one: string, many: string) =>
	`${n} ${n === 1 ? one : many}`

/** "2 new records and 1 load change" — what a finished session changed. */
export const sessionProgressSummary = (
	recordCount: number,
	progressionCount: number,
) => {
	const parts = [
		recordCount > 0 ? count(recordCount, 'new record', 'new records') : null,
		progressionCount > 0
			? count(progressionCount, 'load change', 'load changes')
			: null,
	].filter(Boolean)
	return parts.join(' and ')
}

/** NOTIF-01: the words and destination of one notification. */
export function describeNotification(
	notification: AppNotification,
): NotificationView {
	switch (notification.kind) {
		case 'ACHIEVEMENT':
			return {
				title: `Achievement earned: ${notification.achievement.title}`,
				detail: notification.achievement.description || null,
				href: '/achievements',
			}
		case 'SESSION_PROGRESS': {
			const { session } = notification
			const name = session.dayName
				? `${session.routineName} · ${session.dayName}`
				: session.routineName
			return {
				title: `${name}: ${sessionProgressSummary(session.recordCount, session.progressionCount)}`,
				detail:
					session.progressionCount > 0
						? 'Load changes apply from your next session of this day.'
						: null,
				href: `/workouts/history/${session.id}`,
			}
		}
		case 'NEW_FOLLOWER': {
			const { actor } = notification
			const name = [actor.name, actor.lastName].filter(Boolean).join(' ')
			return {
				title: `${name} started following you`,
				detail: actor.isFollowedByMe
					? `@${actor.username} · you follow them too`
					: `@${actor.username} · open their profile to follow back`,
				href: `/profile/${actor.username}`,
			}
		}
		case 'ACTIVITY_COMMENT': {
			// SOC-06. The comment itself is never quoted: this row outlives it,
			// and its author, the recipient or a moderator can each remove it —
			// a copy here could be withdrawn by none of them. It says who wrote
			// one and sends the reader to the entry, where the words live.
			const { actor } = notification
			const name = [actor.name, actor.lastName].filter(Boolean).join(' ')
			return {
				title: `${name} commented on your activity`,
				detail: `@${actor.username} · open it to read the comment`,
				href: '/activity?view=yours',
			}
		}
		case 'TRAINING_PARTNER_ENCOURAGEMENT': {
			const { actor } = notification
			const name = [actor.name, actor.lastName].filter(Boolean).join(' ')
			return {
				title: `${name} sent encouragement: ${trainingPartnerEncouragementLabel(notification.encouragement.kind)}`,
				detail: `@${actor.username} · from your training partner`,
				href: `/profile/${actor.username}`,
			}
		}
		case 'TRAINING_PARTNER_SESSION': {
			const { actor, session } = notification
			const name = [actor.name, actor.lastName].filter(Boolean).join(' ')
			const workout = session.dayName
				? `${session.routineName} · ${session.dayName}`
				: session.routineName
			return {
				title: `${name} completed a workout`,
				detail: `${workout} · shared by your training partner`,
				href: `/profile/${actor.username}`,
			}
		}
		case 'TRAINING_PARTNER_ACHIEVEMENT': {
			const { actor, achievement } = notification
			const name = [actor.name, actor.lastName].filter(Boolean).join(' ')
			return {
				title: `${name} earned ${achievement.title}`,
				detail: `@${actor.username} · shared by your training partner`,
				href: `/profile/${actor.username}`,
			}
		}
	}
}

/** The bell's accessible name, which carries the unread count. */
export const notificationsBellLabel = (unreadCount: number) =>
	unreadCount > 0
		? `Notifications, ${count(unreadCount, 'unread', 'unread')}`
		: 'Notifications'

/**
 * Marks notifications read in a cached list, as the server will: the given
 * ids, or every one without ids. Already-read ones keep their time.
 */
export function markReadInCache(
	data: NotificationsResponse,
	ids: readonly string[] | undefined,
	now: Date,
): NotificationsResponse {
	const readAt = now.toISOString()
	let marked = 0
	const notifications = data.notifications.map(notification => {
		if (notification.readAt || (ids && !ids.includes(notification.id))) {
			return notification
		}
		marked += 1
		return { ...notification, readAt }
	})
	return {
		notifications,
		unreadCount: ids ? Math.max(0, data.unreadCount - marked) : 0,
	}
}
