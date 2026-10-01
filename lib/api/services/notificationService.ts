import type {
	MarkNotificationsReadRequest,
	MarkNotificationsReadResponse,
	NotificationsQuery,
	NotificationsResponse,
} from '@sunsteel/contracts'

import { httpClient } from './httpClient'

const NOTIFICATIONS_API_URL = '/notifications'

/** NOTIF-01: the owner's in-app notifications and their read state. */
export const notificationService = {
	/** NOTIF-09: one page, newest first; no cursor reads the first. */
	getNotifications: async (
		query: NotificationsQuery = {},
	): Promise<NotificationsResponse> => {
		const params = new URLSearchParams()
		if (query.limit) params.set('limit', String(query.limit))
		if (query.cursor) params.set('cursor', query.cursor)
		const search = params.toString()
		return httpClient.request<NotificationsResponse>(
			search ? `${NOTIFICATIONS_API_URL}?${search}` : NOTIFICATIONS_API_URL,
			{ method: 'GET', secure: true },
		)
	},

	markRead: async (
		data: MarkNotificationsReadRequest,
	): Promise<MarkNotificationsReadResponse> =>
		httpClient.request<MarkNotificationsReadResponse>(
			`${NOTIFICATIONS_API_URL}/read`,
			{ method: 'POST', body: JSON.stringify(data), secure: true },
		),
}
