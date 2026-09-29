import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	getPreferredTrainingStyleLabel,
	getTrainingDisciplineLabel,
	getTrainingExperienceLabel,
	getTrainingGoalLabel,
	hasTrainingIdentity,
	trainingGoalOptions,
} from './training-identity'

const en = translatorFor('en', 'routines.identity')
const es = translatorFor('es', 'routines.identity')

describe('training identity presentation', () => {
	it('formats stored enum values for people', () => {
		expect(getTrainingGoalLabel('MUSCLE_GROWTH', en)).toBe('Muscle growth')
		expect(getTrainingExperienceLabel('INTERMEDIATE', en)).toBe('Intermediate')
		expect(getTrainingDisciplineLabel('HYBRID_TRAINING', en)).toBe(
			'Hybrid training',
		)
		expect(getPreferredTrainingStyleLabel('PUSH_PULL_LEGS', en)).toBe(
			'Push / pull / legs',
		)
	})

	it('says the same in Spanish without changing the stored values (I18N-03)', () => {
		expect(getTrainingGoalLabel('MUSCLE_GROWTH', es)).toBe(
			'Crecimiento muscular',
		)
		expect(getTrainingExperienceLabel('BEGINNER', es)).toBe('Principiante')
		expect(trainingGoalOptions(es)[0]).toEqual({
			value: 'STRENGTH',
			label: 'Fuerza',
		})
		expect(trainingGoalOptions(en).map(option => option.value)).toEqual(
			trainingGoalOptions(es).map(option => option.value),
		)
	})

	it('distinguishes a genuinely empty identity from a populated one', () => {
		expect(hasTrainingIdentity(undefined)).toBe(false)
		expect(
			hasTrainingIdentity({
				goals: [],
				experienceLevel: null,
				disciplines: [],
				preferredStyle: null,
				favoriteExercises: [],
			}),
		).toBe(false)
		expect(
			hasTrainingIdentity({
				goals: ['STRENGTH'],
				experienceLevel: null,
				disciplines: [],
				preferredStyle: null,
				favoriteExercises: [],
			}),
		).toBe(true)
	})
})
