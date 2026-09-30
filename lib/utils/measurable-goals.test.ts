import type { MeasurableGoal } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	buildMeasurableGoalsRequest,
	convertMeasurableGoalDrafts,
	createMeasurableGoalDraft,
	getMeasurableGoalLabel,
	measurableGoalsToDrafts,
} from './measurable-goals'

const en = translatorFor('en', 'progress.goals')
const es = translatorFor('es', 'progress.goals')

const savedGoal: MeasurableGoal = {
	id: 'goal-1',
	type: 'BODY_WEIGHT',
	targetValue: 100,
	direction: 'AT_MOST',
	exercise: null,
	createdAt: '2026-09-13T00:00:00.000Z',
	updatedAt: '2026-09-13T00:00:00.000Z',
}

describe('measurable goal drafts', () => {
	it('round-trips canonical weight targets through the account unit', () => {
		const [draft] = measurableGoalsToDrafts([savedGoal], 'LB')
		expect(draft.target).toBe('220.46')
		const request = buildMeasurableGoalsRequest([draft], 'LB', en)
		expect(request.goals[0]).toMatchObject({
			id: 'goal-1',
			type: 'BODY_WEIGHT',
			direction: 'AT_MOST',
		})
		expect(request.goals[0].targetValue).toBeCloseTo(100, 2)
	})

	it('converts only weight-based drafts when the unit changes', () => {
		const sessions = { ...createMeasurableGoalDraft(), target: '4' }
		const volume = {
			...createMeasurableGoalDraft('WEEKLY_VOLUME'),
			target: '100',
		}
		const converted = convertMeasurableGoalDrafts(
			[sessions, volume],
			'KG',
			'LB',
		)
		expect(converted.map(goal => goal.target)).toEqual(['4', '220.46'])
	})

	const refusals = [
		{
			locale: 'en',
			t: en,
			target: 'Check the target for Weekly sessions.',
			exercise: 'Choose an exercise for every strength goal.',
			unique: 'Each measurable goal must be unique.',
		},
		{
			locale: 'es',
			t: es,
			target: 'Revisa el objetivo de Sesiones por semana.',
			exercise: 'Elige un ejercicio para cada objetivo de fuerza.',
			unique: 'Cada objetivo medible debe ser único.',
		},
	] as const

	for (const refusal of refusals) {
		it(`requires integer counts, exercises and unique goals in ${refusal.locale}`, () => {
			expect(() =>
				buildMeasurableGoalsRequest(
					[{ ...createMeasurableGoalDraft(), target: '2.5' }],
					'KG',
					refusal.t,
				),
			).toThrow(refusal.target)
			expect(() =>
				buildMeasurableGoalsRequest(
					[
						{
							...createMeasurableGoalDraft('EXERCISE_ESTIMATED_1RM'),
							target: '100',
						},
					],
					'KG',
					refusal.t,
				),
			).toThrow(refusal.exercise)
			expect(() =>
				buildMeasurableGoalsRequest(
					[
						{ ...createMeasurableGoalDraft(), target: '3' },
						{ ...createMeasurableGoalDraft(), target: '4' },
					],
					'KG',
					refusal.t,
				),
			).toThrow(refusal.unique)
		})
	}

	it('names every goal type in both languages', () => {
		expect(getMeasurableGoalLabel('WEEKLY_VOLUME', en)).toBe(
			'Weekly load volume',
		)
		expect(getMeasurableGoalLabel('WEEKLY_VOLUME', es)).toBe(
			'Volumen de carga semanal',
		)
		expect(getMeasurableGoalLabel('BODY_WEIGHT', es)).toBe('Peso corporal')
	})
})
