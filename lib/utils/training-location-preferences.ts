import type {
	ReplaceTrainingLocationsRequest,
	TrainingLocationPreference,
	WeightUnit,
} from '@sunsteel/contracts'

import { formatWeightInput, parseWeightInput } from './weight-unit'

const roundCanonicalWeight = (value: number) =>
	Math.round(value * 10000) / 10000

export interface PlatePairDraft {
	key: string
	weight: string
	pairCount: string
}

export interface TrainingLocationDraft {
	key: string
	id?: string
	name: string
	isDefault: boolean
	barWeight: string
	availablePlatePairs: PlatePairDraft[]
	equipment: string
}

let draftSequence = 0
const nextDraftKey = (prefix: string) => `${prefix}-${++draftSequence}`

export const createTrainingLocationDraft = (
	weightUnit: WeightUnit,
	index: number,
): TrainingLocationDraft => ({
	key: nextDraftKey('location'),
	name: index === 0 ? 'Home Gym' : `Gym ${index + 1}`,
	isDefault: index === 0,
	barWeight: formatWeightInput(20, weightUnit),
	availablePlatePairs: [],
	equipment: '',
})

export const createPlatePairDraft = (
	weightUnit: WeightUnit,
): PlatePairDraft => ({
	key: nextDraftKey('plate'),
	weight: formatWeightInput(2.5, weightUnit),
	pairCount: '1',
})

export const trainingLocationsToDrafts = (
	locations: TrainingLocationPreference[],
	weightUnit: WeightUnit,
): TrainingLocationDraft[] =>
	locations.map(location => ({
		key: location.id,
		id: location.id,
		name: location.name,
		isDefault: location.isDefault,
		barWeight: formatWeightInput(location.barWeightKg, weightUnit),
		availablePlatePairs: location.availablePlatePairs.map(plate => ({
			key: nextDraftKey(`plate-${location.id}`),
			weight: formatWeightInput(plate.weightKg, weightUnit),
			pairCount: String(plate.pairCount),
		})),
		equipment: location.equipment.join(', '),
	}))

export const convertTrainingLocationDrafts = (
	drafts: TrainingLocationDraft[],
	from: WeightUnit,
	to: WeightUnit,
): TrainingLocationDraft[] => {
	if (from === to) return drafts

	return drafts.map(location => ({
		...location,
		barWeight: formatWeightInput(
			parseWeightInput(location.barWeight, from),
			to,
		),
		availablePlatePairs: location.availablePlatePairs.map(plate => ({
			...plate,
			weight: formatWeightInput(parseWeightInput(plate.weight, from), to),
		})),
	}))
}

export const buildTrainingLocationsRequest = (
	drafts: TrainingLocationDraft[],
	weightUnit: WeightUnit,
): ReplaceTrainingLocationsRequest => {
	if (drafts.length > 0) {
		const defaultCount = drafts.filter(location => location.isDefault).length
		if (defaultCount !== 1) {
			throw new Error('Choose exactly one default training location.')
		}
	}

	const names = new Set<string>()
	return {
		locations: drafts.map(location => {
			const name = location.name.trim()
			const normalizedName = name.toLocaleLowerCase('en-US')
			if (!name) throw new Error('Every training location needs a name.')
			if (names.has(normalizedName)) {
				throw new Error('Training location names must be unique.')
			}
			names.add(normalizedName)

			const parsedBarWeight = parseWeightInput(location.barWeight, weightUnit)
			const barWeightKg = parsedBarWeight
				? roundCanonicalWeight(parsedBarWeight)
				: parsedBarWeight
			if (!barWeightKg || barWeightKg < 0.5 || barWeightKg > 100) {
				throw new Error(`Enter a valid bar weight for ${name}.`)
			}

			const plateWeights = new Set<number>()
			const availablePlatePairs = location.availablePlatePairs.map(plate => {
				const parsedWeight = parseWeightInput(plate.weight, weightUnit)
				const weightKg = parsedWeight
					? roundCanonicalWeight(parsedWeight)
					: parsedWeight
				const pairCount = Number(plate.pairCount)
				if (!weightKg || weightKg < 0.05 || weightKg > 100) {
					throw new Error(`Enter valid plate weights for ${name}.`)
				}
				if (!Number.isInteger(pairCount) || pairCount < 1 || pairCount > 20) {
					throw new Error(`Plate pair counts for ${name} must be from 1 to 20.`)
				}
				if (plateWeights.has(weightKg)) {
					throw new Error(`Plate weights for ${name} must be unique.`)
				}
				plateWeights.add(weightKg)
				return { weightKg, pairCount }
			})

			return {
				...(location.id ? { id: location.id } : {}),
				name,
				isDefault: location.isDefault,
				barWeightKg,
				availablePlatePairs,
				equipment: Array.from(
					new Set(
						location.equipment
							.split(',')
							.map(item => item.trim().toLocaleLowerCase('en-US'))
							.filter(Boolean),
					),
				).sort(),
			}
		}),
	}
}
