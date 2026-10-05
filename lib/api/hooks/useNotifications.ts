import type {
	MarkNotificationsReadRequest,
	NotificationsResponse,
} from '@sunsteel/contracts'
import {
	type InfiniteData,
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query'

import { useRealtimeLive } from '@/lib/realtime/realtime-status'
import { notificationsPollInterval } from '@/lib/realtime/realtime-stream'
import {
	flattenNotificationPages,
	markReadInPages,
	withUnreadCount,
} from '@/lib/utils/notifications'

import { notificationService } from '../services/notificationService'

type NotificationPagesData = InfiniteData<NotificationsResponse, string | null>

export const notificationKeys = {
	all: () => ['notifications'] as const,
	/** NOTIF-09: every page the list has loaded, under one key. */
	list: () => ['notifications', 'list'] as const,
}

/**
 * NOTIF-01/NOTIF-09: the owner's notifications, read a page at a time, and
 * the unread count. The top bar and sidebar read it on every protected page
 * and only ever need the first page; the Notifications page loads the rest
 * as its end scrolls into view. It refreshes on focus and, while the MSG-06
 * stream is not live, every five minutes; while it is live the stream's
 * signals refresh it instead. A refresh re-reads the loaded pages in order
 * from the first, so they stay one consistent list.
 */
export const useNotifications = () => {
	const live = useRealtimeLive()
	const query = useInfiniteQuery<
		NotificationsResponse,
		Error,
		NotificationsResponse,
		ReturnType<typeof notificationKeys.list>,
		string | null
	>({
		queryKey: notificationKeys.list(),
		queryFn: ({ pageParam }) =>
			notificationService.getNotifications(
				pageParam ? { cursor: pageParam } : {},
			),
		initialPageParam: null,
		// A server older than NOTIF-09 sends no cursor: one page, as before.
		getNextPageParam: last => last.nextCursor ?? null,
		select: flattenNotificationPages,
		staleTime: 60_000,
		refetchInterval: notificationsPollInterval(live),
		refetchOnWindowFocus: true,
	})
	return query
}

/** Marks read at once in the cache; the server's count then replaces it. */
export const useMarkNotificationsRead = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: MarkNotificationsReadRequest) =>
			notificationService.markRead(data),
		onMutate: async ({ ids }) => {
			await queryClient.cancelQueries({ queryKey: notificationKeys.list() })
			const previous = queryClient.getQueryData<NotificationPagesData>(
				notificationKeys.list(),
			)
			if (previous) {
				queryClient.setQueryData(
					notificationKeys.list(),
					markReadInPages(previous, ids, new Date()),
				)
			}
			return { previous }
		},
		onError: (_error, _data, context) => {
			if (context?.previous) {
				queryClient.setQueryData(notificationKeys.list(), context.previous)
			}
		},
		onSuccess: ({ unreadCount }) => {
			queryClient.setQueryData<NotificationPagesData>(
				notificationKeys.list(),
				current => (current ? withUnreadCount(current, unreadCount) : current),
			)
		},
	})
}
