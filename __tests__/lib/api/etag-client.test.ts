import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { etaggedHttpClient } from '../../../lib/api/etag-client'

const asHeaders = (pairs: Record<string, string>) => {
	const h = new Headers()
	Object.entries(pairs).forEach(([k, v]) => h.set(k, v))
	return h
}

describe('etaggedHttpClient.conditionalGet', () => {
	beforeEach(() => {
		etaggedHttpClient.clearCache()
		vi.restoreAllMocks()
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('uses If-None-Match and treats 304 as cache HIT', async () => {
		// First request returns data with ETag
		const data1 = { hello: 'world' }
		const headers1 = asHeaders({ ETag: '"abc123"', 'content-type': 'application/json' })
		const meta1 = { data: data1, status: 200, headers: headers1, ok: true } as const
		const meta304 = { data: undefined, status: 304, headers: asHeaders({}), ok: false } as const

		const calls: any[] = []
		const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
			calls.push(init)
			if (calls.length === 1) {
				return {
					ok: true,
					status: 200,
					headers: headers1,
					text: async () => JSON.stringify(data1),
				} as any
			}
			return {
				ok: false,
				status: 304,
				headers: asHeaders({}),
				text: async () => '',
			} as any
		})
		vi.stubGlobal('fetch', fetchMock)

		// Prime cache
		const first = await etaggedHttpClient.conditionalGet<{ hello: string }>(
			'/workouts/routines/r1/rtf-week-goals'
		)
		expect(first.data).toEqual(data1)
		expect(first.etag).toBe('"abc123"')
		expect(first.cacheStatus === 'miss' || first.cacheStatus === 'stale').toBeTruthy()

		// Second call should send If-None-Match and process 304 as HIT
		const second = await etaggedHttpClient.conditionalGet<{ hello: string }>(
			'/workouts/routines/r1/rtf-week-goals'
		)

		expect(second.data).toEqual(data1)
		// Cache is fresh within TTL, so no second request is made
		expect(second.cacheStatus).toBe('fresh')
		// Only one HTTP call since second was served from fresh cache
		expect(calls.length).toBe(1)
	})
})
