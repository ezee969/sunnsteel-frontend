import {
	type PlatePairInventory,
	type PlateSetChoice,
	type ReplaceTrainingLocationsRequest,
	type TrainingLocationPreference,
	type WeightUnit,
} from '@sunsteel/contracts'

import type { PlateLoadingItem } from './plate-calculator'
import { formatWeight } from './weight-unit'

// The ramp rule itself is shared with the server since LIVE-20.
export {
	BAR_CHOICES_KG,
	BAR_WARM_UP_STEPS,
	buildWarmUpRamp,
	isBarLoaded,
	LIMITED_SHORTFALL_KG,
	MAX_SETS_PER_EXERCISE,
	OTHER_WARM_UP_STEPS,
	PLATE_SETS,
	type PlateSetChoice,
	type WarmUpRamp,
	type WarmUpSet,
} from '@sunsteel/contracts'

export const PLATE_SET_LABELS: Record<PlateSetChoice, string> = {
	STANDARD: 'Standard plates',
	LIGHT: 'Lighter plates only',
}

/**
 * LIVE-13: warm-up sets generated in the routine builder from the exercise's
 * working load. They are ordinary WARMUP sets (LIVE-12) once inserted: they
 * never count as work and progression never moves them.
 */

const round = (value: number) => Math.round(value * 10000) / 10000

/** What the ramp is built from, as the preview states it. */
export type EquipmentBasis =
	| { kind: 'SAVED'; location: TrainingLocationPreference }
	| { kind: 'NO_PLATES'; location: TrainingLocationPreference }
	| { kind: 'NO_LOCATION' }

export const equipmentBasis = (
	location: TrainingLocationPreference | undefined,
): EquipmentBasis =>
	!location
		? { kind: 'NO_LOCATION' }
		: location.availablePlatePairs.some(p => p.pairCount > 0)
			? { kind: 'SAVED', location }
			: { kind: 'NO_PLATES', location }

/** The one line saying what the loads were made from. */
export function describeBasis(input: {
	barLoaded: boolean
	basis: EquipmentBasis
	barWeightKg: number
	plateSet: PlateSetChoice
	incrementKg: number
	unit: WeightUnit
}): string {
	const { unit } = input
	if (!input.barLoaded)
		return `Rounded down to this exercise's ${formatWeight(input.incrementKg, unit)} step.`
	const bar = `${formatWeight(input.barWeightKg, unit)} bar`
	const plates = PLATE_SET_LABELS[input.plateSet].toLowerCase()
	if (input.basis.kind === 'SAVED')
		return `${input.basis.location.name} · ${bar} · your plates.`
	if (input.basis.kind === 'NO_PLATES')
		return `${input.basis.location.name} · ${bar} · no plates saved there, so ${plates} are assumed.`
	return `No gym saved yet: ${bar} and ${plates}.`
}

/** "20 + 5 per side", or "Bar only". */
export function describePlates(
	plates: readonly PlateLoadingItem[] | undefined,
	unit: WeightUnit,
): string {
	if (!plates || plates.length === 0) return 'Bar only'
	const list = plates.flatMap(item =>
		Array.from({ length: item.platesPerSide }, () =>
			formatWeight(item.weightKg, unit).replace(/\s?(kg|lb)$/, ''),
		),
	)
	return `${list.join(' + ')} per side`
}

/**
 * The save that makes the chosen equipment the member's gym: a new default
 * location when there is none, or the plates added to the location that had
 * none. Every other location is sent back unchanged, since the write
 * replaces the whole list.
 */
export function saveEquipmentRequest(input: {
	locations: readonly TrainingLocationPreference[]
	basis: EquipmentBasis
	barWeightKg: number
	platePairs: readonly PlatePairInventory[]
}): ReplaceTrainingLocationsRequest | null {
	const keep = (location: TrainingLocationPreference) => ({
		id: location.id,
		name: location.name,
		isDefault: location.isDefault,
		barWeightKg: location.barWeightKg,
		availablePlatePairs: location.availablePlatePairs,
		equipment: location.equipment,
	})
	const platePairs = input.platePairs.map(pair => ({
		weightKg: round(pair.weightKg),
		pairCount: pair.pairCount,
	}))
	if (input.basis.kind === 'SAVED') return null
	if (input.basis.kind === 'NO_PLATES') {
		const target = input.basis.location.id
		return {
			locations: input.locations.map(location =>
				location.id === target
					? { ...keep(location), availablePlatePairs: platePairs }
					: keep(location),
			),
		}
	}
	return {
		locations: [
			{
				name: 'Home Gym',
				isDefault: true,
				barWeightKg: round(input.barWeightKg),
				availablePlatePairs: platePairs,
				equipment: [],
			},
		],
	}
}
