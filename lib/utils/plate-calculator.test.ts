import { describe, expect, it } from 'vitest'

import { calculatePlateLoading } from './plate-calculator'

const standardPlates = [
	{ weightKg: 20, pairCount: 2 },
	{ weightKg: 10, pairCount: 1 },
	{ weightKg: 5, pairCount: 1 },
	{ weightKg: 2.5, pairCount: 1 },
	{ weightKg: 1.25, pairCount: 1 },
]

describe('plate calculator', () => {
	it('finds an exact per-side loading from the saved inventory', () => {
		expect(calculatePlateLoading(92.5, 20, standardPlates)).toEqual({
			targetWeightKg: 92.5,
			loadedWeightKg: 92.5,
			differenceKg: 0,
			status: 'exact',
			platesPerSide: [
				{ weightKg: 20, platesPerSide: 1 },
				{ weightKg: 10, platesPerSide: 1 },
				{ weightKg: 5, platesPerSide: 1 },
				{ weightKg: 1.25, platesPerSide: 1 },
			],
		})
	})

	it('respects pair quantities and returns the closest load below target', () => {
		const result = calculatePlateLoading(140, 20, [
			{ weightKg: 25, pairCount: 1 },
			{ weightKg: 20, pairCount: 1 },
		])

		expect(result.status).toBe('short')
		expect(result.loadedWeightKg).toBe(110)
		expect(result.differenceKg).toBe(30)
		expect(result.platesPerSide).toEqual([
			{ weightKg: 25, platesPerSide: 1 },
			{ weightKg: 20, platesPerSide: 1 },
		])
	})

	it('does not assume greedy loading is optimal', () => {
		const result = calculatePlateLoading(44, 20, [
			{ weightKg: 8, pairCount: 1 },
			{ weightKg: 6, pairCount: 2 },
		])

		expect(result.status).toBe('exact')
		expect(result.platesPerSide).toEqual([{ weightKg: 6, platesPerSide: 2 }])
	})

	it('reports when the saved bar is heavier than the target', () => {
		expect(calculatePlateLoading(15, 20, standardPlates)).toMatchObject({
			loadedWeightKg: 20,
			differenceKg: 5,
			status: 'over',
			platesPerSide: [],
		})
	})

	it('uses the bare bar when it exactly matches the target', () => {
		expect(calculatePlateLoading(20, 20, [])).toMatchObject({
			loadedWeightKg: 20,
			differenceKg: 0,
			status: 'exact',
			platesPerSide: [],
		})
	})
})
