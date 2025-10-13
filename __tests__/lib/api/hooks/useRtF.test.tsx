import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { useRtFTimeline, useRtFForecast } from '@/lib/api/hooks/useRtF'

vi.mock('@/lib/api/etag-client', async () => {
	return {
		rtfApi: {
			getTimeline: vi.fn(async (_id: string, _opts?: any) => ({
				data: { timeline: [], fromWeek: 1 },
				etag: '"t1"',
				lastModified: new Date().toISOString(),
				cacheStatus: 'miss',
			})),
			getForecast: vi.fn(async (_id: string, _week?: number, _opts?: any) => ({
				data: { forecast: [], fromWeek: 1 },
				etag: '"f1"',
				lastModified: new Date().toISOString(),
				cacheStatus: 'miss',
			})),
		},
	}
})

const createWrapper = () => {
	const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
	// eslint-disable-next-line react/display-name
	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={qc}>{children}</QueryClientProvider>
	)
}

describe('useRtF hooks', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('calls timeline with remaining=1 when flag set', async () => {
		const { rtfApi } = await import('@/lib/api/etag-client')
		const Wrapper = createWrapper()
		renderHook(() => useRtFTimeline('rid-1', true), { wrapper: Wrapper })
		await waitFor(() => expect((rtfApi.getTimeline as any)).toHaveBeenCalled())
		const call = (rtfApi.getTimeline as any).mock.calls.at(-1)
		expect(call[0]).toBe('rid-1')
		expect(call[1]).toMatchObject({ remaining: true })
	})

	it('calls forecast with remaining=1 and targetWeek', async () => {
		const { rtfApi } = await import('@/lib/api/etag-client')
		const Wrapper = createWrapper()
		renderHook(() => useRtFForecast('rid-9', { targetWeeks: [10], remaining: true }), { wrapper: Wrapper })
		await waitFor(() => expect((rtfApi.getForecast as any)).toHaveBeenCalled())
		const call = (rtfApi.getForecast as any).mock.calls.at(-1)
		expect(call[0]).toBe('rid-9')
		expect(call[1]).toBe(10)
		expect(call[2]).toMatchObject({ remaining: true })
	})
})
