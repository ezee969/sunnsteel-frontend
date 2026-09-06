import type { WorkoutAnalyticsStatus } from '@sunsteel/contracts'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./httpClient', () => ({
	httpClient: { get: vi.fn(), request: vi.fn() },
}))

import { httpClient } from './httpClient'
import { bootstrapWorkoutAnalytics } from './workoutAnalyticsService'

const status = (
	overrides: Partial<WorkoutAnalyticsStatus>,
): WorkoutAnalyticsStatus => ({
	timeZone: null,
	requestedTimeZone: null,
	state: 'UNINITIALIZED',
	generationId: null,
	...overrides,
})

describe('account analytics bootstrap', () => {
	beforeEach(() => vi.clearAllMocks())
	it('registers the detected zone only for an uninitialized account', async () => {
		vi.mocked(httpClient.get).mockResolvedValue(status({}))
		vi.mocked(httpClient.request).mockResolvedValue(
			status({ state: 'BUILDING' }),
		)
		await bootstrapWorkoutAnalytics()
		expect(httpClient.get).toHaveBeenCalledWith('/users/time-zone', true)
		expect(httpClient.request).toHaveBeenCalledWith('/users/time-zone', {
			method: 'PUT',
			secure: true,
			body: JSON.stringify({
				timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				onlyIfUnset: true,
			}),
		})
	})
	it.each(['READY', 'BUILDING', 'FAILED'] as const)(
		'preserves the account zone during %s, including travel',
		async state => {
			const account = status({
				state,
				timeZone: 'Pacific/Auckland',
				requestedTimeZone: 'Pacific/Auckland',
			})
			vi.mocked(httpClient.get).mockResolvedValue(account)
			expect(await bootstrapWorkoutAnalytics()).toEqual(account)
			expect(httpClient.request).not.toHaveBeenCalled()
		},
	)
	it('surfaces bootstrap failures for explicit retry', async () => {
		vi.mocked(httpClient.get).mockRejectedValue(new Error('Unavailable'))
		await expect(bootstrapWorkoutAnalytics()).rejects.toThrow('Unavailable')
		expect(httpClient.request).not.toHaveBeenCalled()
	})
})
