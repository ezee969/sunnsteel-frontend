import type {
	ReplaceTrainingLocationsRequest,
	TrainingLocationPreference,
	WeightUnit,
} from '@sunsteel/contracts'

import type { Translator } from '@/i18n/translator'

import { formatWeightInput, parseWeightInput } from './weight-unit'

type Namespace = 'settings.trainingLocations'

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
	t: Translator<Namespace>,
): TrainingLocationDraft => ({
	key: nextDraftKey('location'),
	name:
		index === 0
			? t('defaultName.first')
			: t('defaultName.other', { number: index + 1 }),
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
	t: Translator<Namespace>,
): ReplaceTrainingLocationsRequest => {
	if (drafts.length > 0) {
		const defaultCount = drafts.filter(location => location.isDefault).length
		if (defaultCount !== 1) {
			throw new Error(t('error.chooseDefault'))
		}
	}

	const names = new Set<string>()
	return {
		locations: drafts.map(location => {
			const name = location.name.trim()
			const normalizedName = name.toLocaleLowerCase('en-US')
			if (!name) throw new Error(t('error.nameRequired'))
			if (names.has(normalizedName)) {
				throw new Error(t('error.nameUnique'))
			}
			names.add(normalizedName)

			const parsedBarWeight = parseWeightInput(location.barWeight, weightUnit)
			const barWeightKg = parsedBarWeight
				? roundCanonicalWeight(parsedBarWeight)
				: parsedBarWeight
			if (!barWeightKg || barWeightKg < 0.5 || barWeightKg > 100) {
				throw new Error(t('error.barWeight', { name }))
			}

			const plateWeights = new Set<number>()
			const availablePlatePairs = location.availablePlatePairs.map(plate => {
				const parsedWeight = parseWeightInput(plate.weight, weightUnit)
				const weightKg = parsedWeight
					? roundCanonicalWeight(parsedWeight)
					: parsedWeight
				const pairCount = Number(plate.pairCount)
				if (!weightKg || weightKg < 0.05 || weightKg > 100) {
					throw new Error(t('error.plateWeight', { name }))
				}
				if (!Number.isInteger(pairCount) || pairCount < 1 || pairCount > 20) {
					throw new Error(t('error.pairCount', { name }))
				}
				if (plateWeights.has(weightKg)) {
					throw new Error(t('error.plateUnique', { name }))
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
