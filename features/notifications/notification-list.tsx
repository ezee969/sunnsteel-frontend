'use client'

import {
	type AppNotification,
	NOTIFICATIONS_LOOKBACK_DAYS,
	type NotificationsResponse,
} from '@sunsteel/contracts'
import {
	CheckCheck,
	Dumbbell,
	HeartHandshake,
	Medal,
	MessageSquare,
	RefreshCw,
	TrendingUp,
	UserPlus,
} from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

import { EmptyModule } from '@/components/layout/empty-module'
import { ShowMoreButton, useShowMore } from '@/components/layout/show-more'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatTimeAgo } from '@/lib/utils/date'
import {
	describeNotification,
	EARLIER_NOTIFICATIONS_SHOWN,
	NEW_NOTIFICATIONS_SHOWN,
	splitByRead,
} from '@/lib/utils/notifications'

const KIND_ICON = {
	ACHIEVEMENT: Medal,
	SESSION_PROGRESS: TrendingUp,
	NEW_FOLLOWER: UserPlus,
	ACTIVITY_COMMENT: MessageSquare,
	TRAINING_PARTNER_ENCOURAGEMENT: HeartHandshake,
	TRAINING_PARTNER_SESSION: Dumbbell,
	TRAINING_PARTNER_ACHIEVEMENT: Medal,
} as const

function NotificationRow({
	notification,
	now,
	onOpen,
}: {
	notification: AppNotification
	now: Date
	onOpen: (id: string) => void
}) {
	const locale = useLocale()
	const t = useTranslations('social.notifications')
	const tPartners = useTranslations('settings.trainingPartners')
	const view = describeNotification(notification, t, tPartners)
	const Icon = KIND_ICON[notification.kind]
	const unread = !notification.readAt
	return (
		<li className="rule-row py-4">
			<Link
				href={view.href}
				onClick={() => {
					if (unread) onOpen(notification.id)
				}}
				className="group flex min-w-0 gap-3"
			>
				<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-rule bg-surface">
					<Icon className="size-4 text-foreground" aria-hidden />
				</span>
				<span className="min-w-0 flex-1">
					<span className="type-panel block text-foreground underline-offset-4 group-hover:underline">
						{view.title}
					</span>
					{view.detail ? (
						<span className="type-body-sm mt-1 block text-ink-3">
							{view.detail}
						</span>
					) : null}
					<span className="type-body-sm mt-1 block text-ink-3">
						{/* Unread is a word, never colour alone (§4.3). */}
						{unread ? (
							<span className="type-label mr-2 text-foreground">
								{t('new')}
							</span>
						) : null}
						<time dateTime={notification.createdAt}>
							{formatTimeAgo(notification.createdAt, locale, now)}
						</time>
					</span>
				</span>
			</Link>
		</li>
	)
}

/**
 * UX-09: unread updates under New, then read ones under Earlier, each group
 * showing its first few and a "Show N more" that names the rest. The page
 * keeps its one scroll (design system §20.2).
 */
function GroupedNotifications({
	notifications,
	now,
	onOpen,
}: {
	notifications: readonly AppNotification[]
	now: Date
	onOpen: (id: string) => void
}) {
	const t = useTranslations('social.notifications')
	const { unread, read } = splitByRead(notifications)
	const fresh = useShowMore(unread, NEW_NOTIFICATIONS_SHOWN)
	const earlier = useShowMore(read, EARLIER_NOTIFICATIONS_SHOWN)
	const titled = unread.length > 0 && read.length > 0
	return (
		<>
			{unread.length > 0 ? (
				<div>
					{titled ? (
						<h3 className="type-label text-ink-3">{t('new')}</h3>
					) : null}
					<ul id="notifications-new">
						{fresh.visible.map(notification => (
							<NotificationRow
								key={notification.id}
								notification={notification}
								now={now}
								onOpen={onOpen}
							/>
						))}
					</ul>
					<ShowMoreButton
						label={fresh.label}
						expanded={fresh.expanded}
						onToggle={fresh.toggle}
						controls="notifications-new"
					/>
				</div>
			) : null}
			{read.length > 0 ? (
				<div>
					{titled ? (
						<h3 className="type-label pt-2 text-ink-3">{t('earlier')}</h3>
					) : null}
					<ul id="notifications-earlier">
						{earlier.visible.map(notification => (
							<NotificationRow
								key={notification.id}
								notification={notification}
								now={now}
								onOpen={onOpen}
							/>
						))}
					</ul>
					<ShowMoreButton
						label={earlier.label}
						expanded={earlier.expanded}
						onToggle={earlier.toggle}
						controls="notifications-earlier"
					/>
				</div>
			) : null}
		</>
	)
}

/**
 * NOTIF-01: stored notifications, newest first, as a ruled list. Opening one
 * marks it read; "Mark all read" clears the rest.
 */
export function NotificationList({
	data,
	isPending,
	isError,
	onRetry,
	now,
	onOpen,
	onMarkAll,
	isMarking,
}: {
	data?: NotificationsResponse
	isPending: boolean
	isError: boolean
	onRetry: () => void
	now: Date
	onOpen: (id: string) => void
	onMarkAll: () => void
	isMarking: boolean
}) {
	const t = useTranslations('social.notifications')
	const unread = data?.unreadCount ?? 0
	return (
		<section aria-labelledby="notifications-updates" className="space-y-4">
			<div className="rule-heading flex flex-wrap items-end justify-between gap-3 pb-4">
				<div className="min-w-0">
					<h2
						id="notifications-updates"
						className="type-section text-foreground"
					>
						{t('updates')}
					</h2>
					<p className="type-body-sm mt-1 text-ink-3">
						{t('updatesBody', { days: NOTIFICATIONS_LOOKBACK_DAYS })}
					</p>
				</div>
				{data && data.notifications.length > 0 ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onMarkAll}
						disabled={unread === 0 || isMarking}
					>
						<CheckCheck className="size-4" aria-hidden />
						{t('markAll')}
					</Button>
				) : null}
			</div>

			{isPending ? (
				<div className="space-y-3" aria-label={t('loading')}>
					<Skeleton className="h-16" />
					<Skeleton className="h-16" />
					<Skeleton className="h-16" />
				</div>
			) : isError ? (
				<div role="alert" className="border border-rule bg-surface p-6">
					<p className="type-panel text-foreground">{t('errorTitle')}</p>
					<p className="type-body-sm mt-1 text-ink-3">{t('errorBody')}</p>
					<Button
						type="button"
						variant="outline"
						className="mt-4"
						onClick={onRetry}
					>
						<RefreshCw className="size-4" aria-hidden />
						{t('retry')}
					</Button>
				</div>
			) : !data || data.notifications.length === 0 ? (
				<EmptyModule title={t('emptyTitle')} description={t('emptyBody')} />
			) : (
				<>
					<p className="sr-only" aria-live="polite">
						{unread > 0 ? t('unreadCount', { count: unread }) : t('allRead')}
					</p>
					<GroupedNotifications
						notifications={data.notifications}
						now={now}
						onOpen={onOpen}
					/>
				</>
			)}
		</section>
	)
}
