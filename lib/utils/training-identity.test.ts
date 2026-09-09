import { describe, expect, it } from 'vitest'

import {
	getPreferredTrainingStyleLabel,
	getTrainingDisciplineLabel,
	getTrainingExperienceLabel,
	getTrainingGoalLabel,
	hasTrainingIdentity,
} from './training-identity'

describe('training identity presentation', () => {
	it('formats stored enum values for people', () => {
		expect(getTrainingGoalLabel('MUSCLE_GROWTH')).toBe('Muscle growth')
		expect(getTrainingExperienceLabel('INTERMEDIATE')).toBe('Intermediate')
		expect(getTrainingDisciplineLabel('HYBRID_TRAINING')).toBe(
			'Hybrid training',
		)
		expect(getPreferredTrainingStyleLabel('PUSH_PULL_LEGS')).toBe(
			'Push / pull / legs',
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
