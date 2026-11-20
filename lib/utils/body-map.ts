import {
	countsAsWork,
	MUSCLE_GROUPS,
	type MuscleGroup,
	type MuscleGroupHeatmapWeek,
	type SetKind,
} from '@sunsteel/contracts'

import type { Exercise } from '@/lib/api/types'

/**
 * PROG-15 (design system §32): how much a muscle was trained, in fixed bands
 * of weekly completed-set equivalents (primary 1.0, secondary 0.5). The bands
 * are absolute, so a week, another week and a routine's plan read alike; a
 * week's busiest muscle is not full unless it reached the top band.
 */
export const BODY_MAP_BAND_EDGES = [5, 10, 15, 20] as const

export type BodyMapLevel = 0 | 1 | 2 | 3 | 4 | 5

export const BODY_MAP_LEVELS: readonly BodyMapLevel[] = [0, 1, 2, 3, 4, 5]

export function bodyMapLevel(sets: number): BodyMapLevel {
	if (!(sets > 0)) return 0
	return (1 + BODY_MAP_BAND_EDGES.filter(edge => sets >= edge).length) as
		1 | 2 | 3 | 4 | 5
}

export type MuscleSets = ReadonlyMap<MuscleGroup, number>

export interface MuscleSetsRow {
	muscle: MuscleGroup
	sets: number
}

/** The muscles with any sets, most first; ties in catalog order. */
export function trainedMuscles(sets: MuscleSets): MuscleSetsRow[] {
	return MUSCLE_GROUPS.map(muscle => ({ muscle, sets: sets.get(muscle) ?? 0 }))
		.filter(row => row.sets > 0)
		.sort(
			(a, b) =>
				b.sets - a.sets ||
				MUSCLE_GROUPS.indexOf(a.muscle) - MUSCLE_GROUPS.indexOf(b.muscle),
		)
}

/** The muscles with no sets, in catalog order. */
export function untrainedMuscles(sets: MuscleSets): MuscleGroup[] {
	return MUSCLE_GROUPS.filter(muscle => !((sets.get(muscle) ?? 0) > 0))
}

export function muscleSetsOfWeek(week: MuscleGroupHeatmapWeek): MuscleSets {
	return new Map(week.muscles.map(value => [value.muscle, value.weightedSets]))
}

/**
 * The week the map opens on: the current one when the read has it, else the
 * latest. The read lists weeks oldest first.
 */
export function defaultBodyMapWeek(
	weeks: readonly MuscleGroupHeatmapWeek[],
): string | null {
	if (weeks.length === 0) return null
	return (weeks.find(week => week.isCurrentWeek) ?? weeks[weeks.length - 1])
		.weekStart
}

/** Keeps a chosen week while the read still has it. */
export function resolveBodyMapWeek(
	weeks: readonly MuscleGroupHeatmapWeek[],
	chosen: string | null,
): string | null {
	if (chosen && weeks.some(week => week.weekStart === chosen)) return chosen
	return defaultBodyMapWeek(weeks)
}

/** The last day of a week that starts on `weekStart` (YYYY-MM-DD). */
export function weekEnd(weekStart: string): string {
	const date = new Date(`${weekStart}T00:00:00.000Z`)
	date.setUTCDate(date.getUTCDate() + 6)
	return date.toISOString().slice(0, 10)
}

export interface PlannedDay {
	exercises: ReadonlyArray<{
		exerciseId: string
		sets: ReadonlyArray<{ kind?: SetKind | null }>
	}>
}

/**
 * ROUT-10 and PROG-15: the sets a routine plans for each muscle over its
 * days -- a week, or one pass of a rotation -- weighted as Progress weighs
 * completed sets. Warm-ups are not work (LIVE-12); an exercise the catalog
 * does not describe counts for nothing.
 */
export function plannedMuscleSets(
	days: readonly PlannedDay[],
	exercises: Record<string, Exercise | undefined>,
): MuscleSets {
	const totals = new Map<MuscleGroup, number>()
	for (const day of days) {
		for (const planned of day.exercises) {
			const meta = exercises[planned.exerciseId]
			const workSets = planned.sets.filter(set => countsAsWork(set.kind)).length
			if (!meta || workSets === 0) continue
			const primary = new Set(meta.primaryMuscles)
			for (const muscle of primary) {
				totals.set(muscle, (totals.get(muscle) ?? 0) + workSets)
			}
			for (const muscle of new Set(meta.secondaryMuscles)) {
				if (primary.has(muscle)) continue
				totals.set(muscle, (totals.get(muscle) ?? 0) + workSets * 0.5)
			}
		}
	}
	return totals
}
