'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

import HeroSection from '@/components/layout/HeroSection'
import { useToast } from '@/components/ui/toast'
import { NotificationList } from '@/features/notifications/notification-list'
import { TodayActions } from '@/features/notifications/today-actions'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import {
	useMarkNotificationsRead,
	useNotifications,
} from '@/lib/api/hooks/useNotifications'

export default function NotificationsPage() {
	const errorText = useApiErrorMessage()
	const t = useTranslations('social.notifications')
	const [now] = useState(() => new Date())
	const notifications = useNotifications()
	const markRead = useMarkNotificationsRead()
	const { push } = useToast()

	return (
		<div className="mx-auto flex max-w-4xl flex-col gap-6 sm:gap-8">
			<HeroSection
				title={<>{t('pageTitle')}</>}
				subtitle={<>{t('pageSubtitle')}</>}
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
									title: t('markFailed'),
									description: errorText(error),
									variant: 'destructive',
								}),
						},
					)
				}
				isMarking={markRead.isPending}
				pagination={{
					hasNextPage: notifications.hasNextPage,
					isFetchingNextPage: notifications.isFetchingNextPage,
					isFetchNextPageError: notifications.isFetchNextPageError,
					fetchNextPage: () => void notifications.fetchNextPage(),
				}}
			/>
		</div>
	)
}
