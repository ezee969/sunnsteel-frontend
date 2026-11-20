import {
	MUSCLE_GROUPS,
	type MuscleGroup,
	type MuscleGroupHeatmapResponse,
} from '@sunsteel/contracts'

import { type BodyMapLevel, bodyMapLevel } from './body-map'

export const MUSCLE_HEATMAP_WEEK_OPTIONS = [4, 8, 12] as const
export type MuscleHeatmapWeeks = (typeof MUSCLE_HEATMAP_WEEK_OPTIONS)[number]

export interface MuscleHeatmapRow {
	muscle: MuscleGroup
	weightedSets: number[]
	totalWeightedSets: number
}

/**
 * PROG-15: a cell's level is the body map's fixed band of weekly sets
 * (design system §32), not a share of the window's busiest cell.
 */
export function getMuscleHeatmapLevel(weightedSets: number): BodyMapLevel {
	return bodyMapLevel(weightedSets)
}

export function buildMuscleHeatmapRows(
	heatmap: MuscleGroupHeatmapResponse,
): MuscleHeatmapRow[] {
	const weekMaps = heatmap.weeks.map(
		week =>
			new Map(week.muscles.map(value => [value.muscle, value.weightedSets])),
	)
	return MUSCLE_GROUPS.map(muscle => {
		const weightedSets = weekMaps.map(week => week.get(muscle) ?? 0)
		return {
			muscle,
			weightedSets,
			totalWeightedSets: weightedSets.reduce((sum, value) => sum + value, 0),
		}
	})
}

export function getTopMuscleHeatmapRows(
	rows: MuscleHeatmapRow[],
	limit = 3,
): MuscleHeatmapRow[] {
	return [...rows]
		.filter(row => row.totalWeightedSets > 0)
		.sort(
			(a, b) =>
				b.totalWeightedSets - a.totalWeightedSets ||
				MUSCLE_GROUPS.indexOf(a.muscle) - MUSCLE_GROUPS.indexOf(b.muscle),
		)
		.slice(0, limit)
}
