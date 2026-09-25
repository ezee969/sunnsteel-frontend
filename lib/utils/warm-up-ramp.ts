import type {
	PlatePairInventory,
	ReplaceTrainingLocationsRequest,
	TrainingLocationPreference,
	WeightUnit,
} from '@sunsteel/contracts'

import {
	calculatePlateLoading,
	type PlateLoadingItem,
} from './plate-calculator'
import { formatWeight, POUNDS_PER_KILOGRAM } from './weight-unit'

/**
 * LIVE-13: warm-up sets generated in the routine builder from the exercise's
 * working load. They are ordinary WARMUP sets (LIVE-12) once inserted: they
 * never count as work and progression never moves them.
 */

/** An exercise holds at most this many sets, warm-ups included. */
export const MAX_SETS_PER_EXERCISE = 10

export interface WarmUpStep {
	/** Share of the working load; 0 is the empty bar. */
	share: number
	reps: number
}

/** Plate-loaded work: the empty bar, then 40, 60 and 80 %. */
export const BAR_WARM_UP_STEPS: readonly WarmUpStep[] = [
	{ share: 0, reps: 10 },
	{ share: 0.4, reps: 5 },
	{ share: 0.6, reps: 3 },
	{ share: 0.8, reps: 2 },
]

/** Dumbbells, machines and cables: 50 and 75 %. */
export const OTHER_WARM_UP_STEPS: readonly WarmUpStep[] = [
	{ share: 0.5, reps: 8 },
	{ share: 0.75, reps: 3 },
]

const BAR_LOADED = new Set(['barbell', 'ez-bar', 'smith-machine'])

/** Whether an exercise is loaded with a bar and plates. */
export const isBarLoaded = (equipmentRequired: readonly string[] | undefined) =>
	(equipmentRequired ?? []).some(item => BAR_LOADED.has(item))

const lb = (pounds: number) => pounds / POUNDS_PER_KILOGRAM

/** Bars offered when no location is saved, in the account's unit. */
export const BAR_CHOICES_KG: Record<WeightUnit, number[]> = {
	KG: [20, 15, 10],
	LB: [lb(45), lb(35), lb(15)],
}

export type PlateSetChoice = 'STANDARD' | 'LIGHT'

const pairs = (weights: number[], heaviestPairs: number) =>
	weights.map((weightKg, index) => ({
		weightKg,
		pairCount: index === 0 ? heaviestPairs : 2,
	}))

/** The two plate sets offered when none are saved, in the account's unit. */
export const PLATE_SETS: Record<
	WeightUnit,
	Record<PlateSetChoice, PlatePairInventory[]>
> = {
	KG: {
		STANDARD: pairs([25, 20, 15, 10, 5, 2.5, 1.25], 4),
		LIGHT: pairs([20, 15, 10, 5, 2.5, 1.25], 2),
	},
	LB: {
		STANDARD: pairs([45, 35, 25, 10, 5, 2.5].map(lb), 4),
		LIGHT: pairs([25, 10, 5, 2.5].map(lb), 2),
	},
}

export const PLATE_SET_LABELS: Record<PlateSetChoice, string> = {
	STANDARD: 'Standard plates',
	LIGHT: 'Lighter plates only',
}

export interface WarmUpSet {
	weightKg: number
	reps: number
	/** Bar-loaded only: what goes on each side. */
	platesPerSide?: PlateLoadingItem[]
	/** The plates fell short of the target by a standard small step or more. */
	limited: boolean
}

export interface WarmUpRamp {
	sets: WarmUpSet[]
	/** Steps left out because the exercise had no room for them. */
	leftOut: number
}

interface RampInput {
	workingWeightKg: number
	barLoaded: boolean
	barWeightKg: number
	platePairs: readonly PlatePairInventory[]
	/** The exercise's own weight step, for anything not bar-loaded. */
	incrementKg: number
	/** Sets the exercise can still take. */
	room: number
}

/**
 * A set is "the closest you can load" when the plates fall this far short of
 * its target: the step a standard set of plates (1.25 kg pairs) always makes.
 */
export const LIMITED_SHORTFALL_KG = 2.5

const round = (value: number) => Math.round(value * 10000) / 10000

/**
 * The warm-up sets for a working load: each step rounded down to a load that
 * can be made, a step no heavier than the one before or reaching the working
 * load dropped, and the heaviest kept when there is no room for all of them.
 */
export function buildWarmUpRamp(input: RampInput): WarmUpRamp {
	const { workingWeightKg: work, barLoaded, barWeightKg } = input
	if (!(work > 0)) return { sets: [], leftOut: 0 }
	const steps = barLoaded ? BAR_WARM_UP_STEPS : OTHER_WARM_UP_STEPS
	const increment = input.incrementKg > 0 ? input.incrementKg : 2.5

	const sets: WarmUpSet[] = []
	for (const step of steps) {
		const target = step.share * work
		let set: WarmUpSet
		if (barLoaded) {
			const loading = calculatePlateLoading(
				Math.max(target, barWeightKg),
				barWeightKg,
				[...input.platePairs],
			)
			set = {
				weightKg: round(loading.loadedWeightKg),
				reps: step.reps,
				platesPerSide: loading.platesPerSide,
				limited:
					step.share > 0 &&
					loading.status === 'short' &&
					loading.differenceKg >= LIMITED_SHORTFALL_KG - 1e-9,
			}
		} else {
			set = {
				weightKg: round(Math.floor(target / increment + 1e-9) * increment),
				reps: step.reps,
				limited: false,
			}
		}
		const previous = sets[sets.length - 1]
		if (set.weightKg <= 0 || set.weightKg >= work - 1e-9) continue
		if (previous && set.weightKg <= previous.weightKg + 1e-9) continue
		sets.push(set)
	}
	const room = Math.max(0, input.room)
	const kept = sets.slice(Math.max(0, sets.length - room))
	return { sets: kept, leftOut: sets.length - kept.length }
}

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
