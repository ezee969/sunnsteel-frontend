import type {
	SetAccountTimeZoneRequest,
	WorkoutAnalyticsStatus,
} from '@sunsteel/contracts'

import { httpClient } from './httpClient'

export const workoutAnalyticsService = {
	status: () =>
		httpClient.get<WorkoutAnalyticsStatus>('/users/time-zone', true),
	register: (request: SetAccountTimeZoneRequest) =>
		httpClient.request<WorkoutAnalyticsStatus>('/users/time-zone', {
			method: 'PUT',
			secure: true,
			body: JSON.stringify(request),
		}),
}

/** The server owns the zone. Device detection is used only on first registration. */
export async function bootstrapWorkoutAnalytics() {
	const status = await workoutAnalyticsService.status()
	if (status.state !== 'UNINITIALIZED') return status
	return workoutAnalyticsService.register({
		timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		onlyIfUnset: true,
	})
}
