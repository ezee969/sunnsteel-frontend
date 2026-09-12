import { describe, expect, it } from 'vitest'

import {
	buildExercisePerformanceQueryString,
	buildMuscleGroupHeatmapQueryString,
	buildSessionsQueryString,
	buildVolumeTrendQueryString,
	MAX_SESSIONS_LIMIT,
} from './workoutService'

/**
 * Contract tests against the backend's `ListSessionsDto`.
 *
 * These exist because of TD-22: the dashboard asked for `limit=100`, the DTO
 * validates `@Max(50)`, and the backend rejected the entire request with a 400.
 * The failure was invisible — the four stat cards just rendered 0 — and it
 * survived for as long as nobody looked at the network tab.
 *
 * No test of pure business logic would have caught that. This is the cheapest
 * thing that would have.
 */
describe('sessions list contract', () => {
	it('never sends a limit above what the backend accepts', () => {
		const qs = buildSessionsQueryString({ limit: 100 })
		expect(qs).toBe(`?limit=${MAX_SESSIONS_LIMIT}`)
	})

	it('keeps the cap at the value the backend DTO enforces', () => {
		// If the backend's @Max() changes, change it here in the same commit.
		expect(MAX_SESSIONS_LIMIT).toBe(50)
	})

	it('passes through a limit that is already within range', () => {
		expect(buildSessionsQueryString({ limit: 20 })).toBe('?limit=20')
	})

	it('omits limit entirely when not provided', () => {
		expect(buildSessionsQueryString({})).toBe('')
	})
})

describe('buildSessionsQueryString', () => {
	it('returns an empty string, not a bare "?", when there are no params', () => {
		expect(buildSessionsQueryString({})).toBe('')
	})

	it('includes the leading "?" exactly once when there are params', () => {
		const qs = buildSessionsQueryString({ status: 'COMPLETED', limit: 10 })
		expect(qs.startsWith('?')).toBe(true)
		expect(qs.indexOf('?', 1)).toBe(-1)
	})

	it('serialises every supported filter', () => {
		const qs = buildSessionsQueryString({
			status: 'COMPLETED',
			routineId: 'r1',
			from: '2026-01-01',
			to: '2026-01-31',
			q: 'squat',
			cursor: 'c1',
			limit: 5,
			sort: 'finishedAt:desc',
		})
		const params = new URLSearchParams(qs)
		expect(params.get('status')).toBe('COMPLETED')
		expect(params.get('routineId')).toBe('r1')
		expect(params.get('from')).toBe('2026-01-01')
		expect(params.get('to')).toBe('2026-01-31')
		expect(params.get('q')).toBe('squat')
		expect(params.get('cursor')).toBe('c1')
		expect(params.get('limit')).toBe('5')
		expect(params.get('sort')).toBe('finishedAt:desc')
	})
})

describe('exercise performance history contract', () => {
	it('serialises the exercise, range and cursor used by pagination', () => {
		const query = buildExercisePerformanceQueryString({
			exerciseId: 'exercise-1',
			from: '2026-01-01T00:00:00.000Z',
			to: '2026-03-01T00:00:00.000Z',
			cursor: 'session-1',
			limit: 10,
		})
		const params = new URLSearchParams(query)
		expect(params.get('exerciseId')).toBe('exercise-1')
		expect(params.get('from')).toBe('2026-01-01T00:00:00.000Z')
		expect(params.get('to')).toBe('2026-03-01T00:00:00.000Z')
		expect(params.get('cursor')).toBe('session-1')
		expect(params.get('limit')).toBe('10')
	})

	it('caps the page size at the backend DTO maximum', () => {
		expect(buildExercisePerformanceQueryString({ limit: 100 })).toBe(
			'?limit=30',
		)
	})

	it('omits a bare question mark for the initial default exercise read', () => {
		expect(buildExercisePerformanceQueryString({})).toBe('')
	})
})

describe('muscle-group heatmap contract', () => {
	it('serialises the account time zone and bounded week count', () => {
		const params = new URLSearchParams(
			buildMuscleGroupHeatmapQueryString({
				timeZone: 'Europe/Berlin',
				weeks: 8,
			}),
		)
		expect(params.get('timeZone')).toBe('Europe/Berlin')
		expect(params.get('weeks')).toBe('8')
	})

	it('omits the optional week count without dropping the required zone', () => {
		expect(
			buildMuscleGroupHeatmapQueryString({ timeZone: 'America/New_York' }),
		).toBe('?timeZone=America%2FNew_York')
	})
})

describe('volume trend contract', () => {
	it('serialises the account time zone and bounded week count', () => {
		expect(
			buildVolumeTrendQueryString({
				timeZone: 'Europe/Berlin',
				weeks: 12,
			}),
		).toBe('?timeZone=Europe%2FBerlin&weeks=12')
	})
})
