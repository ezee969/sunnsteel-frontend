import type {
	MoveOccurrenceRequest,
	ScheduleOverride,
	ScheduleOverridesQuery,
	ScheduleOverridesResponse,
} from '@sunsteel/contracts'

import { httpClient } from './httpClient'

const OVERRIDES_API_URL = '/schedule/overrides'

/** SCHED-04: per-date overrides of the owner's routine plans. */
export const scheduleService = {
	getOverrides: async ({
		from,
		to,
	}: ScheduleOverridesQuery): Promise<ScheduleOverridesResponse> => {
		const params = new URLSearchParams({ from, to })
		return httpClient.request<ScheduleOverridesResponse>(
			`${OVERRIDES_API_URL}?${params.toString()}`,
			{ method: 'GET', secure: true },
		)
	},

	moveOccurrence: async (
		data: MoveOccurrenceRequest,
	): Promise<ScheduleOverride> =>
		httpClient.request<ScheduleOverride>(`${OVERRIDES_API_URL}/move`, {
			method: 'PUT',
			body: JSON.stringify(data),
			secure: true,
		}),

	removeOverride: async (id: string): Promise<void> =>
		httpClient.request<void>(`${OVERRIDES_API_URL}/${id}`, {
			method: 'DELETE',
			secure: true,
		}),
}
