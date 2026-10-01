'use client'

import { NOTIFICATIONS_RETENTION_DAYS } from '@sunsteel/contracts'
import { Bell, BellDot, CheckCheck, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useLoadMoreOnScroll } from '@/hooks/use-load-more-on-scroll'
import {
	useMarkNotificationsRead,
	useNotifications,
} from '@/lib/api/hooks/useNotifications'
import { notificationsBellLabel } from '@/lib/utils/navigation-indicators'

import {
	NotificationSummary,
	useDescribeNotification,
} from './notification-list'

/**
 * NOTIF-10: from 768px the bell opens the latest updates instead of leaving
 * the page. It is an overlay, so its list scrolls inside it (design system
 * §20 is about a page's own content) and loads the next page as its end
 * comes into view, with an item that does the same from the keyboard.
 * Today -- the session to resume, today's workouts -- stays on the page,
 * which the last item opens.
 */
export function NotificationMenu() {
	const t = useTranslations('social.notifications')
	const tIndicators = useTranslations('shell.indicators')
	const errorText = useApiErrorMessage()
	const { push } = useToast()
	const notifications = useNotifications()
	const markRead = useMarkNotificationsRead()
	const describe = useDescribeNotification()
	const [now, setNow] = useState(() => new Date())
	const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null)

	const data = notifications.data
	const unread = data?.unreadCount ?? 0
	const Icon = unread > 0 ? BellDot : Bell
	const { hasNextPage, isFetchingNextPage, isFetchNextPageError } =
		notifications
	const sentinel = useLoadMoreOnScroll<HTMLDivElement>({
		enabled: hasNextPage && !isFetchingNextPage && !isFetchNextPageError,
		onLoadMore: () => void notifications.fetchNextPage(),
		root: scrollRoot,
		rootMargin: '120px',
	})

	return (
		<DropdownMenu onOpenChange={open => open && setNow(new Date())}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="size-11 md:size-10"
					aria-label={notificationsBellLabel(unread, tIndicators)}
				>
					<Icon className="h-[1.2rem] w-[1.2rem]" aria-hidden />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="flex w-[min(24rem,calc(100vw-2rem))] flex-col p-0"
			>
				<DropdownMenuLabel className="type-label px-3 py-2.5 text-ink-3">
					{t('updates')}
				</DropdownMenuLabel>
				<DropdownMenuSeparator className="mx-0 my-0" />

				<div
					ref={setScrollRoot}
					className="max-h-[min(28rem,calc(100dvh-12rem))] overflow-y-auto"
				>
					{notifications.isPending ? (
						<div
							role="status"
							aria-label={t('loading')}
							className="space-y-2 p-3"
						>
							<Skeleton className="h-14" />
							<Skeleton className="h-14" />
						</div>
					) : notifications.isError ? (
						<div role="alert" className="space-y-1 p-3">
							<p className="type-panel text-foreground">{t('errorTitle')}</p>
							<p className="type-body-sm text-ink-3">{t('errorBody')}</p>
							<DropdownMenuItem
								onSelect={event => {
									event.preventDefault()
									void notifications.refetch()
								}}
							>
								<RefreshCw aria-hidden />
								{t('retry')}
							</DropdownMenuItem>
						</div>
					) : !data || data.notifications.length === 0 ? (
						<div className="space-y-1 p-3">
							<p className="type-panel text-foreground">{t('emptyTitle')}</p>
							<p className="type-body-sm text-ink-3">{t('emptyBody')}</p>
						</div>
					) : (
						<>
							{data.notifications.map(notification => {
								const view = describe(notification)
								return (
									<DropdownMenuItem
										key={notification.id}
										asChild
										className="group items-start gap-3 border-b border-rule-faint px-3 py-3"
									>
										<Link
											href={view.href}
											onClick={() => {
												if (!notification.readAt) {
													markRead.mutate({ ids: [notification.id] })
												}
											}}
										>
											<NotificationSummary
												notification={notification}
												now={now}
											/>
										</Link>
									</DropdownMenuItem>
								)
							})}
							{hasNextPage ? (
								<div ref={sentinel} className="p-1">
									{isFetchNextPageError ? (
										<p
											role="alert"
											className="type-body-sm px-2 py-1 text-foreground"
										>
											{t('olderError')}
										</p>
									) : null}
									<DropdownMenuItem
										disabled={isFetchingNextPage}
										onSelect={event => {
											// Loading more keeps the menu open.
											event.preventDefault()
											void notifications.fetchNextPage()
										}}
									>
										{isFetchingNextPage ? t('loadingOlder') : t('loadOlder')}
									</DropdownMenuItem>
								</div>
							) : (
								<p className="type-body-sm px-3 py-3 text-ink-3">
									{t('listEnd', { days: NOTIFICATIONS_RETENTION_DAYS })}
								</p>
							)}
						</>
					)}
				</div>

				<DropdownMenuSeparator className="mx-0 my-0" />
				<div className="p-1">
					{data && data.notifications.length > 0 ? (
						<DropdownMenuItem
							disabled={unread === 0 || markRead.isPending}
							onSelect={event => {
								event.preventDefault()
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
							}}
						>
							<CheckCheck aria-hidden />
							{t('markAll')}
						</DropdownMenuItem>
					) : null}
					<DropdownMenuItem asChild>
						<Link href="/notifications">{t('seeAll')}</Link>
					</DropdownMenuItem>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
