import { countsForProgression, type SetKind } from '@sunsteel/contracts'

import type { ProgressionScheme } from '../types'

type KindedSet = { kind?: SetKind; weight?: number | null }

/**
 * LIVE-12: under double progression every working and optional set shares
 * one load, led by the first of them. Warm-ups and drop sets keep their own.
 */
export function leadSetIndex(sets: readonly KindedSet[]): number {
	return sets.findIndex(set => countsForProgression(set.kind))
}

/** Whether a set's load follows the lead set and cannot be edited on its own. */
export function isWeightLocked(
	sets: readonly KindedSet[],
	setIndex: number,
	progressionScheme: ProgressionScheme,
): boolean {
	if (progressionScheme !== 'DOUBLE_PROGRESSION') return false
	const set = sets[setIndex]
	if (!set || !countsForProgression(set.kind)) return false
	return setIndex !== leadSetIndex(sets)
}

/** Copies the lead set's load onto every other working and optional set. */
export function syncLeadWeight(
	sets: KindedSet[],
	progressionScheme: ProgressionScheme,
): void {
	if (progressionScheme !== 'DOUBLE_PROGRESSION') return
	const lead = leadSetIndex(sets)
	if (lead < 0) return
	const weight = sets[lead].weight
	if (weight === undefined) return
	sets.forEach((set, index) => {
		if (index !== lead && countsForProgression(set.kind)) {
			set.weight = weight ?? null
		}
	})
}
