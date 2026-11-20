import type { MuscleGroupHeatmapResponse } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	buildMuscleHeatmapRows,
	getMuscleHeatmapLevel,
	getTopMuscleHeatmapRows,
} from './muscle-heatmap'

const heatmap: MuscleGroupHeatmapResponse = {
	timeZone: 'Europe/Berlin',
	peakWeightedSets: 4,
	weeks: [
		{
			weekStart: '2026-08-31',
			isCurrentWeek: false,
			totalWeightedSets: 5,
			muscles: [
				{ muscle: 'PECTORAL', weightedSets: 4 },
				{ muscle: 'TRICEPS', weightedSets: 1 },
			],
		},
		{
			weekStart: '2026-09-07',
			isCurrentWeek: true,
			totalWeightedSets: 3,
			muscles: [
				{ muscle: 'PECTORAL', weightedSets: 2 },
				{ muscle: 'BICEPS', weightedSets: 1 },
			],
		},
	],
}

describe('muscle-group heatmap', () => {
	it('maps every canonical muscle and fills missing week values with zero', () => {
		const rows = buildMuscleHeatmapRows(heatmap)
		expect(rows).toHaveLength(17)
		expect(rows.find(row => row.muscle === 'PECTORAL')).toEqual({
			muscle: 'PECTORAL',
			weightedSets: [4, 2],
			totalWeightedSets: 6,
		})
		expect(rows.find(row => row.muscle === 'CALVES')?.weightedSets).toEqual([
			0, 0,
		])
	})

	it('bands a cell by its weekly sets, never by the busiest cell (PROG-15)', () => {
		expect(
			[0, 0.5, 4.5, 5, 9.5, 10, 14.5, 15, 19.5, 20, 31].map(value =>
				getMuscleHeatmapLevel(value),
			),
		).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5])
	})

	it('ranks trained muscles while keeping canonical order for ties', () => {
		const top = getTopMuscleHeatmapRows(buildMuscleHeatmapRows(heatmap), 3)
		expect(top.map(row => row.muscle)).toEqual([
			'PECTORAL',
			'BICEPS',
			'TRICEPS',
		])
	})
})
