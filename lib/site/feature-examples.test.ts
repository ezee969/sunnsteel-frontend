import { ACHIEVEMENT_DEFINITIONS } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	BENCH_ON_MAP,
	BLOCK_TABLE,
	LEDGER_TABLE,
	MILESTONES_BY_CATEGORY,
	UPPER_LOWER_WEEKLY_SETS,
	WARM_UP_TABLE,
} from './feature-examples'

describe('the feature pages worked examples (SITE-01 §12.16)', () => {
	it('loads 100 kg on a 20 kg bar with 25 + 15 per side, the ramp below it', () => {
		const working = WARM_UP_TABLE.at(-1)
		expect(working).toMatchObject({ weightKg: 100, working: true })
		expect(working?.platesPerSide).toEqual([25, 15])
		expect(WARM_UP_TABLE.slice(0, -1).every(row => row.weightKg < 100)).toBe(
			true,
		)
	})

	it('raises the ledger by the step only when every set reaches 12', () => {
		expect(LEDGER_TABLE.map(row => row.nextKg)).toEqual([80, 80, 80, 80, 82.5])
	})

	it('runs the 8-week block from 63 % of a 100 kg reference, rounded to 2.5 kg', () => {
		expect(BLOCK_TABLE).toHaveLength(8)
		expect(BLOCK_TABLE[0]).toMatchObject({ week: 1, loadKg: 62.5 })
		expect(BLOCK_TABLE[0].rir.at(-1)).toBe('AMRAP')
		expect(BLOCK_TABLE[4].rir).toEqual(['1–2', '1–2', '1–2'])
	})

	it('counts a bench press set 1 for the chest and 0.5 for its helpers', () => {
		expect(BENCH_ON_MAP).toEqual([
			{ muscle: 'PECTORAL', role: 'primary', sets: 3 },
			{ muscle: 'ANTERIOR_DELTOIDS', role: 'secondary', sets: 1.5 },
			{ muscle: 'TRICEPS', role: 'secondary', sets: 1.5 },
		])
	})

	it('plans Upper / Lower with the chest and back among its most-trained muscles', () => {
		const sets = Object.fromEntries(
			UPPER_LOWER_WEEKLY_SETS.map(row => [row.muscle, row.sets]),
		)
		// Bench Press 4 and Incline Dumbbell Press 3, both primary chest.
		expect(sets.PECTORAL).toBe(7)
		expect(UPPER_LOWER_WEEKLY_SETS.length).toBeGreaterThan(10)
	})

	it('lists every milestone of the catalog, by category', () => {
		expect(
			MILESTONES_BY_CATEGORY.reduce(
				(sum, row) => sum + row.thresholds.length,
				0,
			),
		).toBe(ACHIEVEMENT_DEFINITIONS.length)
	})
})
