import type {
	MarkNotificationsReadRequest,
	NotificationsResponse,
} from '@sunsteel/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { markReadInCache } from '@/lib/utils/notifications'

import { notificationService } from '../services/notificationService'

export const notificationKeys = {
	all: () => ['notifications'] as const,
}

/**
 * NOTIF-01: the owner's notifications and unread count. The top bar reads it
 * on every protected page, so it refreshes on focus and every five minutes
 * rather than waiting out the default stale time.
 */
export const useNotifications = () =>
	useQuery<NotificationsResponse, Error>({
		queryKey: notificationKeys.all(),
		queryFn: notificationService.getNotifications,
		staleTime: 60_000,
		refetchInterval: 5 * 60_000,
		refetchOnWindowFocus: true,
	})

/** Marks read at once in the cache; the server's count then replaces it. */
export const useMarkNotificationsRead = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: MarkNotificationsReadRequest) =>
			notificationService.markRead(data),
		onMutate: async ({ ids }) => {
			await queryClient.cancelQueries({ queryKey: notificationKeys.all() })
			const previous = queryClient.getQueryData<NotificationsResponse>(
				notificationKeys.all(),
			)
			if (previous) {
				queryClient.setQueryData(
					notificationKeys.all(),
					markReadInCache(previous, ids, new Date()),
				)
			}
			return { previous }
		},
		onError: (_error, _data, context) => {
			if (context?.previous) {
				queryClient.setQueryData(notificationKeys.all(), context.previous)
			}
		},
		onSuccess: ({ unreadCount }) => {
			queryClient.setQueryData<NotificationsResponse>(
				notificationKeys.all(),
				current => (current ? { ...current, unreadCount } : current),
			)
		},
	})
}
