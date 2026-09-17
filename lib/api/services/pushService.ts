import type {
	DeletePushSubscriptionRequest,
	NotificationPreferencesResponse,
	PushSubscriptionsResponse,
	RegisterPushSubscriptionRequest,
	ScheduleRestAlertRequest,
	ScheduleRestAlertResponse,
	UpdateNotificationPreferencesRequest,
} from '@sunsteel/contracts'

import { httpClient } from './httpClient'

/** NOTIF-08/NOTIF-02/NOTIF-03: subscribed devices and the rest alert. */
export const pushService = {
	getSubscriptions: (): Promise<PushSubscriptionsResponse> =>
		httpClient.get<PushSubscriptionsResponse>(
			'/notifications/push/subscriptions',
			true,
		),

	register: (
		body: RegisterPushSubscriptionRequest,
	): Promise<PushSubscriptionsResponse> =>
		httpClient.request<PushSubscriptionsResponse>(
			'/notifications/push/subscriptions',
			{ method: 'POST', body: JSON.stringify(body), secure: true },
		),

	unregister: (
		body: DeletePushSubscriptionRequest,
	): Promise<PushSubscriptionsResponse> =>
		httpClient.request<PushSubscriptionsResponse>(
			'/notifications/push/subscriptions',
			{ method: 'DELETE', body: JSON.stringify(body), secure: true },
		),

	scheduleRestAlert: (
		sessionId: string,
		body: ScheduleRestAlertRequest,
	): Promise<ScheduleRestAlertResponse> =>
		httpClient.request<ScheduleRestAlertResponse>(
			`/workouts/sessions/${sessionId}/rest-alert`,
			{ method: 'PUT', body: JSON.stringify(body), secure: true },
		),

	getPreferences: (): Promise<NotificationPreferencesResponse> =>
		httpClient.get<NotificationPreferencesResponse>(
			'/notifications/preferences',
			true,
		),

	updatePreferences: (
		body: UpdateNotificationPreferencesRequest,
	): Promise<NotificationPreferencesResponse> =>
		httpClient.request<NotificationPreferencesResponse>(
			'/notifications/preferences',
			{ method: 'PUT', body: JSON.stringify(body), secure: true },
		),

	cancelRestAlert: (sessionId: string): Promise<void> =>
		httpClient.request<void>(`/workouts/sessions/${sessionId}/rest-alert`, {
			method: 'DELETE',
			secure: true,
		}),
}
