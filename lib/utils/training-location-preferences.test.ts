import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	buildTrainingLocationsRequest,
	convertTrainingLocationDrafts,
	type TrainingLocationDraft,
} from './training-location-preferences'

const t = translatorFor('en', 'settings.trainingLocations')
const tEs = translatorFor('es', 'settings.trainingLocations')

const draft: TrainingLocationDraft = {
	key: 'draft',
	name: ' Home Gym ',
	isDefault: true,
	barWeight: '45',
	availablePlatePairs: [{ key: 'plate', weight: '25', pairCount: '2' }],
	equipment: ' Barbell, rack, BARBELL ',
}

describe('training location preferences', () => {
	it('converts display values while preserving canonical kilograms', () => {
		const request = buildTrainingLocationsRequest([draft], 'LB', t)

		expect(request.locations[0]).toMatchObject({
			name: 'Home Gym',
			barWeightKg: 20.4117,
			availablePlatePairs: [{ weightKg: 11.3398, pairCount: 2 }],
			equipment: ['barbell', 'rack'],
		})
	})

	it('converts unsaved inputs when the account unit changes', () => {
		const [converted] = convertTrainingLocationDrafts([draft], 'LB', 'KG')

		expect(converted.barWeight).toBe('20.41')
		expect(converted.availablePlatePairs[0].weight).toBe('11.34')
	})

	it('rejects missing defaults and duplicate plate weights', () => {
		expect(() =>
			buildTrainingLocationsRequest([{ ...draft, isDefault: false }], 'LB', t),
		).toThrow('Choose exactly one default')

		expect(() =>
			buildTrainingLocationsRequest(
				[
					{
						...draft,
						availablePlatePairs: [
							draft.availablePlatePairs[0],
							{ key: 'duplicate', weight: '25', pairCount: '1' },
						],
					},
				],
				'LB',
				t,
			),
		).toThrow('must be unique')
	})

	it('reports the same problems in Spanish', () => {
		expect(() =>
			buildTrainingLocationsRequest(
				[{ ...draft, isDefault: false }],
				'LB',
				tEs,
			),
		).toThrow('Elige exactamente un lugar de entrenamiento predeterminado.')

		expect(() =>
			buildTrainingLocationsRequest([{ ...draft, name: ' ' }], 'LB', tEs),
		).toThrow('Cada lugar de entrenamiento necesita un nombre.')

		expect(() =>
			buildTrainingLocationsRequest([{ ...draft, barWeight: '' }], 'LB', tEs),
		).toThrow('Ingresa un peso de barra válido para Home Gym.')
	})
})
