/**
 * RTF-F12: Forecast Deterministic Test Harness
 * Mirror of backend tests (RTF-B13) to ensure frontend RTF forecast logic
 * maintains deterministic behavior, proper caching, and snapshot validation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the underlying HTTP client to avoid authentication
const mockRequest = vi.fn()
vi.mock('@/lib/api/services/httpClient', () => ({
	httpClient: {
		request: mockRequest
	}
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
	supabase: {
		auth: {
			getSession: vi.fn().mockResolvedValue({
				data: { session: { access_token: 'fake-token' } }
			})
		}
	}
}))

import { rtfApi } from '../../../lib/api/etag-client'
import type { RtfForecast, RtfForecastWeek } from '../../../lib/api/types'

/**
 * Test utilities for deterministic forecast validation
 */
const makeSnapshot = (withDeloads: boolean) => {
	const weeks = withDeloads ? 21 : 18
	const standard: any[] = []
	const hypertrophy: any[] = []
	
	// Deterministic schedule: intensity increments 0.01 each week
	// Deload weeks (7,14,21) flagged with isDeload
	const deloadWeeks = withDeloads ? new Set([7, 14, 21]) : new Set<number>()
	let trainingIndex = 0
	
	for (let w = 1; w <= 21; w++) {
		const isDeload = deloadWeeks.has(w)
		if (isDeload) {
			standard.push({ week: w, isDeload: true })
			hypertrophy.push({ week: w, isDeload: true })
			continue
		}
		trainingIndex++
		if (!withDeloads && w > 18) break
		
		const logicalWeek = withDeloads ? w : trainingIndex
		standard.push({ 
			week: logicalWeek, 
			intensity: 0.7 + (logicalWeek - 1) * 0.01, 
			fixedReps: 5, 
			amrapTarget: 8,
			sets: 5,
			amrapSet: 5
		})
		hypertrophy.push({ 
			week: logicalWeek, 
			intensity: 0.65 + (logicalWeek - 1) * 0.01, 
			fixedReps: 8, 
			amrapTarget: 12,
			sets: 4,
			amrapSet: 4
		})
		
		if (!withDeloads && logicalWeek === 18) break
	}
	
	return { 
		version: 1, 
		withDeloads, 
		weeks, 
		standard, 
		hypertrophy 
	}
}

const makeMockForecast = (withDeloads: boolean): RtfForecast => {
	const forecast = makeSnapshot(withDeloads)
	return {
		routineId: 'r1',
		weeks: forecast.weeks,
		version: 1,
		withDeloads: forecast.withDeloads,
		forecast: forecast.standard.map((std, index): RtfForecastWeek => ({
			week: std.week,
			isDeload: std.isDeload || false,
			standard: std.isDeload ? undefined : std,
			hypertrophy: std.isDeload ? undefined : forecast.hypertrophy[index]
		}))
	}
}

describe('RTF Forecast Deterministic (RTF-F12)', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('returns deterministic forecast with deloads (cache miss)', async () => {
		const expectedForecast = makeMockForecast(true)
		mockRequest.mockResolvedValue({
			data: expectedForecast,
			status: 200,
			headers: { etag: '"abc123"' }
		})

		const result = await rtfApi.getForecast('r1')
		const forecast = result.data as RtfForecast

		expect(forecast).toEqual(expectedForecast)
		expect(forecast.withDeloads).toBe(true)
		expect(forecast.weeks).toBe(21)
		
		// Week 7 should be deload
		const week7 = forecast.forecast.find((w: RtfForecastWeek) => w.week === 7)
		expect(week7?.isDeload).toBe(true)
		
		// Week 1 intensity should be deterministic
		const week1 = forecast.forecast.find((w: RtfForecastWeek) => w.week === 1)
		expect(week1?.standard?.intensity).toBeCloseTo(0.7, 5)
	})

	it('returns deterministic forecast without deloads', async () => {
		const expectedForecast = makeMockForecast(false)
		mockRequest.mockResolvedValue({
			data: expectedForecast,
			status: 200,
			headers: { etag: '"def456"' }
		})

		const result = await rtfApi.getForecast('r1')
		const forecast = result.data as RtfForecast

		expect(forecast.withDeloads).toBe(false)
		expect(forecast.weeks).toBe(18)
		
		// Should not have deload weeks
		const deloadWeeks = forecast.forecast.filter((w: RtfForecastWeek) => w.isDeload)
		expect(deloadWeeks).toHaveLength(0)
		
		// Last week should be 18
		const lastWeek = forecast.forecast[forecast.forecast.length - 1]
		expect(lastWeek.week).toBe(18)
	})

	it('validates forecast structure consistency', async () => {
		const expectedForecast = makeMockForecast(true)
		mockRequest.mockResolvedValue({
			data: expectedForecast,
			status: 200,
			headers: {}
		})

		const result = await rtfApi.getForecast('r1')
		const forecast = result.data

		// Validate structure
		expect(forecast).toHaveProperty('routineId')
		expect(forecast).toHaveProperty('weeks')
		expect(forecast).toHaveProperty('version')
		expect(forecast).toHaveProperty('withDeloads')
		expect(forecast).toHaveProperty('forecast')
		
		// Validate forecast entries
		forecast.forecast.forEach((week: RtfForecastWeek) => {
			expect(week).toHaveProperty('week')
			expect(week).toHaveProperty('isDeload')
			
			if (!week.isDeload) {
				expect(week.standard).toHaveProperty('intensity')
				expect(week.standard).toHaveProperty('fixedReps')
				expect(week.standard).toHaveProperty('amrapTarget')
				expect(week.standard).toHaveProperty('sets')
				expect(week.standard).toHaveProperty('amrapSet')
				
				expect(week.hypertrophy).toHaveProperty('intensity')
				expect(week.hypertrophy).toHaveProperty('fixedReps')
				expect(week.hypertrophy).toHaveProperty('amrapTarget')
				expect(week.hypertrophy).toHaveProperty('sets')
				expect(week.hypertrophy).toHaveProperty('amrapSet')
			}
		})
	})

	it('handles API errors gracefully', async () => {
		const apiError = new Error('Network error')
		mockRequest.mockRejectedValue(apiError)

		await expect(rtfApi.getForecast('r1')).rejects.toThrow('Network error')
	})

	it('validates week progression is sequential', async () => {
		const expectedForecast = makeMockForecast(false)
		mockRequest.mockResolvedValue({
			data: expectedForecast,
			status: 200,
			headers: {}
		})

		const result = await rtfApi.getForecast('r1')
		const forecast = result.data

		// Verify weeks are sequential starting from 1
		const weeks = forecast.forecast.map((w: RtfForecastWeek) => w.week).sort((a: number, b: number) => a - b)
		for (let i = 0; i < weeks.length; i++) {
			expect(weeks[i]).toBe(i + 1)
		}
	})

	it('validates deload pattern consistency (weeks 7, 14, 21)', async () => {
		const expectedForecast = makeMockForecast(true)
		mockRequest.mockResolvedValue({
			data: expectedForecast,
			status: 200,
			headers: {}
		})

		const result = await rtfApi.getForecast('r1')
		const forecast = result.data

		// Check deload weeks
		const deloadWeeks = forecast.forecast.filter((w: RtfForecastWeek) => w.isDeload).map((w: RtfForecastWeek) => w.week)
		expect(deloadWeeks).toEqual([7, 14, 21])
		
		// Check training weeks have proper data
		const trainingWeeks = forecast.forecast.filter((w: RtfForecastWeek) => !w.isDeload)
		trainingWeeks.forEach((week: RtfForecastWeek) => {
			expect(week.standard?.intensity).toBeGreaterThan(0)
			expect(week.standard?.fixedReps).toBeGreaterThan(0)
			expect(week.standard?.amrapTarget).toBeGreaterThan(0)
			expect(week.hypertrophy?.intensity).toBeGreaterThan(0)
			expect(week.hypertrophy?.fixedReps).toBeGreaterThan(0)
			expect(week.hypertrophy?.amrapTarget).toBeGreaterThan(0)
		})
	})

	it('validates intensity progression is monotonic (excluding deloads)', async () => {
		const expectedForecast = makeMockForecast(false) // No deloads for cleaner progression
		mockRequest.mockResolvedValue({
			data: expectedForecast,
			status: 200,
			headers: {}
		})

		const result = await rtfApi.getForecast('r1')
		const forecast = result.data

		const trainingWeeks = forecast.forecast.filter((w: RtfForecastWeek) => !w.isDeload)
		
		// Check standard progression
		for (let i = 1; i < trainingWeeks.length; i++) {
			const prevIntensity = trainingWeeks[i - 1].standard?.intensity || 0
			const currIntensity = trainingWeeks[i].standard?.intensity || 0
			expect(currIntensity).toBeGreaterThan(prevIntensity)
		}
		
		// Check hypertrophy progression
		for (let i = 1; i < trainingWeeks.length; i++) {
			const prevIntensity = trainingWeeks[i - 1].hypertrophy?.intensity || 0
			const currIntensity = trainingWeeks[i].hypertrophy?.intensity || 0
			expect(currIntensity).toBeGreaterThan(prevIntensity)
		}
	})

	it('maintains deterministic output across multiple calls', async () => {
		const expectedForecast = makeMockForecast(true)
		mockRequest.mockResolvedValue({
			data: expectedForecast,
			status: 200,
			headers: { etag: '"stable123"' }
		})

		const result1 = await rtfApi.getForecast('r1')
		const result2 = await rtfApi.getForecast('r1')

		// Results should be identical
		expect(result1.data).toEqual(result2.data)
		expect(result1.data.forecast.length).toBe(result2.data.forecast.length)
		
		// Spot check deterministic values
		expect(result1.data.forecast[0].standard?.intensity)
			.toEqual(result2.data.forecast[0].standard?.intensity)
	})

	it('validates cache integration with ETag client', async () => {
		const expectedForecast = makeMockForecast(true)
		
		// Mock ETag response pattern
		mockRequest
			.mockResolvedValueOnce({ 
				data: expectedForecast, 
				status: 200, 
				headers: { etag: '"abc123"' } 
			})
			.mockResolvedValueOnce({ 
				status: 304, 
				data: null,
				headers: { etag: '"abc123"' }
			}) // Not modified

		const result1 = await rtfApi.getForecast('r1')
		
		// First call should get data
		expect(result1.data).toEqual(expectedForecast)
		
		// Second call should use ETag (implementation may handle 304 internally)
		const result2 = await rtfApi.getForecast('r1')
		expect(mockRequest).toHaveBeenCalledTimes(2)
	})

	it('validates forecast data ranges are realistic', async () => {
		const expectedForecast = makeMockForecast(false)
		mockRequest.mockResolvedValue({
			data: expectedForecast,
			status: 200,
			headers: {}
		})

		const result = await rtfApi.getForecast('r1')
		const forecast = result.data

		// Validate intensity ranges
		forecast.forecast.forEach((week: RtfForecastWeek) => {
			if (!week.isDeload) {
				// Standard intensities should be in reasonable range
				expect(week.standard?.intensity).toBeGreaterThanOrEqual(0.5)
				expect(week.standard?.intensity).toBeLessThanOrEqual(1.0)
				
				// Hypertrophy intensities should be lower than standard
				expect(week.hypertrophy?.intensity).toBeGreaterThanOrEqual(0.4)
				expect(week.hypertrophy?.intensity).toBeLessThanOrEqual(0.9)
				
				// Rep ranges should be sensible
				expect(week.standard?.fixedReps).toBeGreaterThanOrEqual(1)
				expect(week.standard?.fixedReps).toBeLessThanOrEqual(15)
				expect(week.hypertrophy?.fixedReps).toBeGreaterThanOrEqual(1)
				expect(week.hypertrophy?.fixedReps).toBeLessThanOrEqual(20)
				
				// AMRAP targets should be reasonable
				expect(week.standard?.amrapTarget).toBeGreaterThanOrEqual(5)
				expect(week.hypertrophy?.amrapTarget).toBeGreaterThanOrEqual(8)
			}
		})
	})
})