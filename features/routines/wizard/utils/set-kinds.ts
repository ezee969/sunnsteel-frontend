import {
	countsForProgression,
	defaultWarmUpEquipment,
	isBarLoaded,
	PLATE_SETS,
	type SetKind,
	type TrainingLocationPreference,
	type WarmUpEquipment,
	type WeightUnit,
} from '@sunsteel/contracts'

import type { ProgressionScheme } from '../types'

type KindedSet = {
	kind?: SetKind
	weight?: number | null
	warmUpShare?: number | null
}

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
	warmUpsFollowLoad = false,
): boolean {
	const set = sets[setIndex]
	if (!set) return false
	// LIVE-20: a following warm-up is recalculated from the working load.
	if (isFollowingWarmUp(set, warmUpsFollowLoad)) return true
	if (progressionScheme !== 'DOUBLE_PROGRESSION') return false
	if (!countsForProgression(set.kind)) return false
	return setIndex !== leadSetIndex(sets)
}

/** A warm-up whose load is recalculated from the first working set. */
export const isFollowingWarmUp = (
	set: KindedSet,
	warmUpsFollowLoad: boolean | undefined,
) =>
	Boolean(warmUpsFollowLoad) &&
	set.kind === 'WARMUP' &&
	typeof set.warmUpShare === 'number'

/**
 * LIVE-20: what a following warm-up's load is made from in the builder --
 * the same choice the server makes after progression: the gym's bar, its
 * plates or else a standard set, and with no gym a standard bar and set in
 * the account's unit.
 */
export function builderWarmUpEquipment(input: {
	equipmentRequired: readonly string[] | undefined
	gym: TrainingLocationPreference | undefined
	unit: WeightUnit
	incrementKg: number
}): WarmUpEquipment {
	const fallback = defaultWarmUpEquipment(input.unit)
	const plates =
		input.gym?.availablePlatePairs.filter(pair => pair.pairCount > 0) ?? []
	return {
		barLoaded: isBarLoaded(input.equipmentRequired),
		barWeightKg: input.gym?.barWeightKg ?? fallback.barWeightKg,
		platePairs: plates.length > 0 ? plates : PLATE_SETS[input.unit].STANDARD,
		incrementKg: input.incrementKg,
	}
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
