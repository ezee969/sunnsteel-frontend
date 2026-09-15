'use client'

import {
	type AppNotification,
	NOTIFICATIONS_LOOKBACK_DAYS,
	type NotificationsResponse,
} from '@sunsteel/contracts'
import {
	CheckCheck,
	Medal,
	RefreshCw,
	TrendingUp,
	UserPlus,
} from 'lucide-react'
import Link from 'next/link'

import { EmptyModule } from '@/components/layout/empty-module'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatTimeAgo } from '@/lib/utils/date'
import { describeNotification } from '@/lib/utils/notifications'

const KIND_ICON = {
	ACHIEVEMENT: Medal,
	SESSION_PROGRESS: TrendingUp,
	NEW_FOLLOWER: UserPlus,
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
	const view = describeNotification(notification)
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
							<span className="type-label mr-2 text-foreground">New</span>
						) : null}
						<time dateTime={notification.createdAt}>
							{formatTimeAgo(notification.createdAt, now)}
						</time>
					</span>
				</span>
			</Link>
		</li>
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
	const unread = data?.unreadCount ?? 0
	return (
		<section aria-labelledby="notifications-updates" className="space-y-4">
			<div className="rule-heading flex flex-wrap items-end justify-between gap-3 pb-4">
				<div className="min-w-0">
					<h2
						id="notifications-updates"
						className="type-section text-foreground"
					>
						Updates
					</h2>
					<p className="type-body-sm mt-1 text-ink-3">
						Achievements you earn, records and load changes from finished
						sessions, and new followers, from the last{' '}
						{NOTIFICATIONS_LOOKBACK_DAYS} days.
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
						Mark all read
					</Button>
				) : null}
			</div>

			{isPending ? (
				<div className="space-y-3" aria-label="Loading notifications">
					<Skeleton className="h-16" />
					<Skeleton className="h-16" />
					<Skeleton className="h-16" />
				</div>
			) : isError ? (
				<div role="alert" className="border border-rule bg-surface p-6">
					<p className="type-panel text-foreground">
						Notifications are unavailable
					</p>
					<p className="type-body-sm mt-1 text-ink-3">
						We could not load them. Try again.
					</p>
					<Button
						type="button"
						variant="outline"
						className="mt-4"
						onClick={onRetry}
					>
						<RefreshCw className="size-4" aria-hidden />
						Retry
					</Button>
				</div>
			) : !data || data.notifications.length === 0 ? (
				<EmptyModule
					title="Nothing new yet"
					description="Achievements you earn, new records and load changes from finished sessions, and new followers will appear here."
				/>
			) : (
				<>
					<p className="sr-only" aria-live="polite">
						{unread > 0 ? `${unread} unread` : 'All read'}
					</p>
					<ul>
						{data.notifications.map(notification => (
							<NotificationRow
								key={notification.id}
								notification={notification}
								now={now}
								onOpen={onOpen}
							/>
						))}
					</ul>
				</>
			)}
		</section>
	)
}
