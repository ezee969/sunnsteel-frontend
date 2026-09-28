'use client'

import { useState } from 'react'

import HeroSection from '@/components/layout/HeroSection'
import { useToast } from '@/components/ui/toast'
import { NotificationList } from '@/features/notifications/notification-list'
import { TodayActions } from '@/features/notifications/today-actions'
import {
	useMarkNotificationsRead,
	useNotifications,
} from '@/lib/api/hooks/useNotifications'

export default function NotificationsPage() {
	const [now] = useState(() => new Date())
	const notifications = useNotifications()
	const markRead = useMarkNotificationsRead()
	const { push } = useToast()

	return (
		<div className="mx-auto flex max-w-4xl flex-col gap-6 sm:gap-8">
			<HeroSection
				title={<>Notifications</>}
				subtitle={<>What changed for you, and what you can do today.</>}
			/>
			<TodayActions />
			<NotificationList
				data={notifications.data}
				isPending={notifications.isPending}
				isError={notifications.isError}
				onRetry={() => void notifications.refetch()}
				now={now}
				onOpen={id => markRead.mutate({ ids: [id] })}
				onMarkAll={() =>
					markRead.mutate(
						{},
						{
							onError: error =>
								push({
									title: 'Not marked read',
									description: error.message,
									variant: 'destructive',
								}),
						},
					)
				}
				isMarking={markRead.isPending}
			/>
		</div>
	)
}
