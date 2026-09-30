import type {
	AppNotification,
	NotificationsResponse,
} from '@sunsteel/contracts'

import { achievementText } from '@/i18n/catalog'
import type { Translator } from '@/i18n/translator'

import { trainingPartnerEncouragementLabel } from './training-partners'

type T = Translator<'social.notifications'>
type TPartners = Translator<'settings.trainingPartners'>

export interface NotificationView {
	title: string
	detail: string | null
	href: string
}

/** "2 new records and 1 load change" — what a finished session changed. */
export const sessionProgressSummary = (
	recordCount: number,
	progressionCount: number,
	t: T,
) =>
	t('progressSummary', {
		records: recordCount,
		changes: progressionCount,
		both: recordCount > 0 && progressionCount > 0 ? 'yes' : 'no',
	})

/** NOTIF-01: the words and destination of one notification. */
export function describeNotification(
	notification: AppNotification,
	t: T,
	tPartners: TPartners,
	tAchievements?: Translator<'catalog.achievements'>,
): NotificationView {
	const text = (value: { id: string; title: string; description?: string }) =>
		tAchievements
			? achievementText(value, tAchievements)
			: { title: value.title, description: value.description ?? '' }
	switch (notification.kind) {
		case 'ACHIEVEMENT':
			return {
				title: t('achievementTitle', {
					title: text(notification.achievement).title,
				}),
				detail: text(notification.achievement).description || null,
				href: '/achievements',
			}
		case 'SESSION_PROGRESS': {
			const { session } = notification
			const name = session.dayName
				? `${session.routineName} · ${session.dayName}`
				: session.routineName
			return {
				title: t('sessionTitle', {
					name,
					summary: sessionProgressSummary(
						session.recordCount,
						session.progressionCount,
						t,
					),
				}),
				detail: session.progressionCount > 0 ? t('loadChangesApply') : null,
				href: `/workouts/history/${session.id}`,
			}
		}
		case 'NEW_FOLLOWER': {
			const { actor } = notification
			const name = [actor.name, actor.lastName].filter(Boolean).join(' ')
			return {
				title: t('followerTitle', { name }),
				detail: actor.isFollowedByMe
					? t('followerMutual', { username: actor.username })
					: t('followerBack', { username: actor.username }),
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
				title: t('commentTitle', { name }),
				detail: t('commentDetail', { username: actor.username }),
				href: '/activity?view=yours',
			}
		}
		case 'TRAINING_PARTNER_ENCOURAGEMENT': {
			const { actor } = notification
			const name = [actor.name, actor.lastName].filter(Boolean).join(' ')
			return {
				title: t('encouragementTitle', {
					name,
					prompt: trainingPartnerEncouragementLabel(
						notification.encouragement.kind,
						tPartners,
					),
				}),
				detail: t('encouragementDetail', { username: actor.username }),
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
				title: t('partnerSessionTitle', { name }),
				detail: t('partnerSessionDetail', { workout }),
				href: `/profile/${actor.username}`,
			}
		}
		case 'TRAINING_PARTNER_ACHIEVEMENT': {
			const { actor, achievement } = notification
			const name = [actor.name, actor.lastName].filter(Boolean).join(' ')
			return {
				title: t('partnerAchievementTitle', {
					name,
					title: text(achievement).title,
				}),
				detail: t('partnerAchievementDetail', { username: actor.username }),
				href: `/profile/${actor.username}`,
			}
		}
	}
}

/** The bell's accessible name, which carries the unread count. */
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

/**
 * UX-09: how many updates each group, New and Earlier, shows before its own
 * "Show N more". New is bounded too: an account that rarely opens the page
 * can hold dozens of unread updates, and the control always names how many
 * more there are, so nothing new is hidden without its count on screen.
 */
export const NEW_NOTIFICATIONS_SHOWN = 5
export const EARLIER_NOTIFICATIONS_SHOWN = 5

/** Unread first and read after, each newest first as the server sent them. */
export function splitByRead(notifications: readonly AppNotification[]): {
	unread: AppNotification[]
	read: AppNotification[]
} {
	return {
		unread: notifications.filter(n => !n.readAt),
		read: notifications.filter(n => Boolean(n.readAt)),
	}
}
