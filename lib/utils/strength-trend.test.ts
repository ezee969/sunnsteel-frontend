import type { ExerciseStrengthTrendResponse } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	getStrengthChartCoordinates,
	getStrengthDisplayPoints,
	getStrengthMetricDelta,
	getStrengthTrendRange,
} from './strength-trend'

const point = (achievedAt: string, weightKg: number) => ({
	sessionId: achievedAt,
	achievedAt,
	weightKg,
	reps: 5,
	estimated1rmKg: weightKg * 1.16,
})

describe('getStrengthTrendRange', () => {
	it('builds stable rolling presets and leaves all-time unbounded', () => {
		const now = new Date('2026-09-10T12:00:00.000Z')
		expect(getStrengthTrendRange('30D', now)).toEqual({
			from: '2026-08-11T12:00:00.000Z',
			to: '2026-09-10T12:00:00.000Z',
		})
		expect(getStrengthTrendRange('6M', now).from).toBe(
			'2026-03-10T12:00:00.000Z',
		)
		expect(getStrengthTrendRange('ALL', now)).toEqual({
			to: '2026-09-10T12:00:00.000Z',
		})
	})
})

describe('strength trend presentation', () => {
	it('plots the pre-range frontier at the start without changing its true date', () => {
		const trend = {
			exercises: [],
			selectedExercise: null,
			range: {
				from: '2026-06-01T00:00:00.000Z',
				to: '2026-09-01T00:00:00.000Z',
			},
			baseline: point('2026-05-01T12:00:00.000Z', 100),
			points: [point('2026-07-01T12:00:00.000Z', 105)],
			truncated: false,
		} satisfies ExerciseStrengthTrendResponse
		const display = getStrengthDisplayPoints(trend)
		expect(display[0]).toMatchObject({
			achievedAt: '2026-05-01T12:00:00.000Z',
			plottedAt: '2026-06-01T00:00:00.000Z',
			isBaseline: true,
		})
		expect(getStrengthMetricDelta(display, item => item.weightKg)).toBe(5)
	})

	it('scales points within the chart and centers flat series', () => {
		const coordinates = getStrengthChartCoordinates(
			[
				{ time: 0, value: 100 },
				{ time: 10, value: 120 },
			],
			item => item.time,
			item => item.value,
			100,
			60,
			10,
		)
		expect(coordinates.map(({ x, y }) => [x, y])).toEqual([
			[10, 50],
			[90, 10],
		])
		expect(
			getStrengthChartCoordinates(
				[{ time: 0, value: 100 }],
				item => item.time,
				item => item.value,
				100,
				60,
			)[0],
		).toMatchObject({ x: 50, y: 30 })
	})
})
