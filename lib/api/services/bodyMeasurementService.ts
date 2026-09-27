import type {
	BodyMeasurement,
	BodyProgressRange,
	BodyProgressResponse,
	UpsertBodyMeasurementRequest,
} from '@sunsteel/contracts'

import { httpClient } from './httpClient'

const range = (value: BodyProgressRange) =>
	`?range=${encodeURIComponent(value)}`

/** PROG-12: dated body weight and measurements. */
export const bodyMeasurementService = {
	getOwn(value: BodyProgressRange): Promise<BodyProgressResponse> {
		return httpClient.get<BodyProgressResponse>(
			`/body-measurements${range(value)}`,
			true,
		)
	},

	/** Another member's, signed in; 404 unless their body progress visibility allows it. */
	getMember(
		identifier: string,
		value: BodyProgressRange,
	): Promise<BodyProgressResponse> {
		return httpClient.get<BodyProgressResponse>(
			`/users/${encodeURIComponent(identifier)}/body-measurements${range(value)}`,
			true,
		)
	},

	/** Signed out: only a member who shares body progress with everyone. */
	getPublic(
		identifier: string,
		value: BodyProgressRange,
	): Promise<BodyProgressResponse> {
		return httpClient.get<BodyProgressResponse>(
			`/profiles/${encodeURIComponent(identifier)}/body-measurements${range(value)}`,
		)
	},

	upsert(
		date: string,
		data: UpsertBodyMeasurementRequest,
	): Promise<BodyMeasurement> {
		return httpClient.request<BodyMeasurement>(`/body-measurements/${date}`, {
			method: 'PUT',
			body: JSON.stringify(data),
			secure: true,
		})
	},

	remove(date: string): Promise<void> {
		return httpClient.delete<void>(`/body-measurements/${date}`, true)
	},
}
