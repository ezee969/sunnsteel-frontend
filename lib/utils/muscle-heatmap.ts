import {
	MUSCLE_GROUPS,
	type MuscleGroup,
	type MuscleGroupHeatmapResponse,
} from '@sunsteel/contracts'

export const MUSCLE_HEATMAP_WEEK_OPTIONS = [4, 8, 12] as const
export type MuscleHeatmapWeeks = (typeof MUSCLE_HEATMAP_WEEK_OPTIONS)[number]

export interface MuscleHeatmapRow {
	muscle: MuscleGroup
	weightedSets: number[]
	totalWeightedSets: number
}

export function getMuscleHeatmapLevel(
	weightedSets: number,
	peakWeightedSets: number,
): 0 | 1 | 2 | 3 | 4 {
	if (weightedSets <= 0 || peakWeightedSets <= 0) return 0
	const ratio = weightedSets / peakWeightedSets
	if (ratio <= 0.25) return 1
	if (ratio <= 0.5) return 2
	if (ratio <= 0.75) return 3
	return 4
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
