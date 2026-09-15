import type {
	MarkNotificationsReadRequest,
	MarkNotificationsReadResponse,
	NotificationsResponse,
} from '@sunsteel/contracts'

import { httpClient } from './httpClient'

const NOTIFICATIONS_API_URL = '/notifications'

/** NOTIF-01: the owner's in-app notifications and their read state. */
export const notificationService = {
	getNotifications: async (): Promise<NotificationsResponse> =>
		httpClient.request<NotificationsResponse>(NOTIFICATIONS_API_URL, {
			method: 'GET',
			secure: true,
		}),

	markRead: async (
		data: MarkNotificationsReadRequest,
	): Promise<MarkNotificationsReadResponse> =>
		httpClient.request<MarkNotificationsReadResponse>(
			`${NOTIFICATIONS_API_URL}/read`,
			{ method: 'POST', body: JSON.stringify(data), secure: true },
		),
}
