import { describe, expect, it } from 'vitest'

import {
	formatPreviousPerformance,
	isSetPerformanceImproved,
} from './previous-performance.utils'

const previous = {
	routineExerciseId: 'routine-exercise-1',
	exerciseId: 'exercise-1',
	setNumber: 1,
	reps: 8,
	weight: 80,
}

describe('isSetPerformanceImproved', () => {
	it('uses the established weight-then-reps ordering', () => {
		expect(isSetPerformanceImproved({ reps: 6, weight: 82.5 }, previous)).toBe(
			true,
		)
		expect(isSetPerformanceImproved({ reps: 9, weight: 80 }, previous)).toBe(
			true,
		)
	})

	it('does not call a tie or a lighter set an improvement', () => {
		expect(isSetPerformanceImproved({ reps: 8, weight: 80 }, previous)).toBe(
			false,
		)
		expect(isSetPerformanceImproved({ reps: 20, weight: 79 }, previous)).toBe(
			false,
		)
	})

	it('ignores display-rounding noise when comparing equal weights', () => {
		expect(
			isSetPerformanceImproved({ reps: 9, weight: 79.998 }, previous),
		).toBe(true)
	})

	it('compares reps for bodyweight sets and ignores incomplete input', () => {
		const bodyweight = { ...previous, weight: null }
		expect(
			isSetPerformanceImproved({ reps: 9, weight: undefined }, bodyweight),
		).toBe(true)
		expect(
			isSetPerformanceImproved({ reps: 0, weight: undefined }, bodyweight),
		).toBe(false)
	})
})

describe('formatPreviousPerformance', () => {
	it('displays a logged weight in the selected unit', () => {
		expect(formatPreviousPerformance(previous, 'KG')).toBe('8 reps · 80 kg')
		expect(formatPreviousPerformance(previous, 'LB')).toBe('8 reps · 176.37 lb')
	})

	it('does not invent a weight for bodyweight sets', () => {
		expect(formatPreviousPerformance({ ...previous, weight: null }, 'LB')).toBe(
			'8 reps',
		)
		expect(
			formatPreviousPerformance({ ...previous, reps: 1, weight: 0 }, 'KG'),
		).toBe('1 rep')
	})
})
