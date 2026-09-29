import {
	ACHIEVEMENT_DEFINITIONS,
	RENAISSANCE_RANK_DEFINITIONS,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { MESSAGES } from '@/messages'

import { achievementText, exerciseLabel, rankText } from './catalog'
import { translatorFor } from './translator'

describe('catalog labels (I18N-07)', () => {
	it('keeps every English achievement exactly as contracts writes it', () => {
		const en = translatorFor('en', 'catalog.achievements')
		for (const definition of ACHIEVEMENT_DEFINITIONS)
			expect(achievementText(definition, en)).toEqual({
				title: definition.title,
				description: definition.description,
			})
	})

	it('writes achievements in Spanish, with singulars and grouped numbers', () => {
		const es = translatorFor('es', 'catalog.achievements')
		const byId = (id: string) =>
			achievementText(
				ACHIEVEMENT_DEFINITIONS.find(entry => entry.id === id)!,
				es,
			)
		expect(byId('sessions:1').title).toBe('Primera sesión')
		expect(byId('sessions:10')).toEqual({
			title: '10 sesiones',
			description: 'Completa 10 sesiones de entrenamiento.',
		})
		expect(byId('records:1').description).toBe(
			'Establece récords en 1 ejercicio.',
		)
		expect(byId('volume_kg:250000').title).toBe('250.000 kg movidos')
		expect(byId('streak_days:5').title).toBe('Racha de 5 días')
	})

	it('keeps English rank names and gives each a Spanish one', () => {
		const en = translatorFor('en', 'catalog.ranks')
		const es = translatorFor('es', 'catalog.ranks')
		for (const rank of RENAISSANCE_RANK_DEFINITIONS) {
			expect(rankText(rank, en)).toEqual({
				title: rank.title,
				description: rank.description,
			})
			expect(rankText(rank, es).title).not.toBe('')
		}
		expect(rankText(RENAISSANCE_RANK_DEFINITIONS[5], es).title).toBe('Laureado')
	})

	it('names catalog exercises in Spanish and leaves anything else as stored', () => {
		const en = translatorFor('en', 'catalog.exercises')
		const es = translatorFor('es', 'catalog.exercises')
		expect(exerciseLabel('Bench Press', es)).toBe('Press de banca')
		expect(exerciseLabel('Bench Press', en)).toBe('Bench Press')
		expect(exerciseLabel('My Sled Push', es)).toBe('My Sled Push')
		expect(exerciseLabel('', es)).toBe('')
	})

	it('translates every catalog exercise and names each one only once', () => {
		const names = Object.keys(MESSAGES.en.catalog.exercises)
		const spanish = Object.values(MESSAGES.es.catalog.exercises)
		expect(names.length).toBe(80)
		expect(new Set(spanish).size).toBe(spanish.length)
		for (const name of names)
			expect(MESSAGES.en.catalog.exercises[name as never]).toBe(name)
	})

	it('falls back to the stored text for an id it cannot read', () => {
		const es = translatorFor('es', 'catalog.achievements')
		expect(
			achievementText({ id: 'custom', title: 'X', description: 'Y' }, es),
		).toEqual({ title: 'X', description: 'Y' })
	})
})
