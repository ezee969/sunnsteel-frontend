import type { ProgressionChange } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	getProgressionRuleExplanation,
	getProgressionSetPresentation,
} from './progression-change'

const change: ProgressionChange = {
	routineExerciseId: 'routine-exercise-1',
	exerciseId: 'bench',
	exerciseName: 'Bench Press',
	progressionScheme: 'DOUBLE_PROGRESSION',
	rule: 'ALL_SETS_REACHED_TARGET',
	minWeightIncrementKg: 2.5,
	sets: [
		{
			setNumber: 1,
			targetReps: 10,
			performedReps: 11,
			previousWeightKg: 100,
			newWeightKg: 102.5,
		},
	],
}

const en = translatorFor('en', 'progress.progressionChange')
const es = translatorFor('es', 'progress.progressionChange')

describe('progression change presentation', () => {
	it('explains the all-sets rule and canonical increment', () => {
		expect(getProgressionRuleExplanation(change, 'KG', en)).toBe(
			'All 1 set reached the rep target, so every prescribed load advanced by 2.5 kg.',
		)
	})

	it('explains per-set progression with correct pluralisation', () => {
		expect(
			getProgressionRuleExplanation(
				{ ...change, rule: 'SET_REACHED_TARGET' },
				'KG',
				en,
			),
		).toBe('1 set reached the rep target and advanced independently by 2.5 kg.')
	})

	it('converts both old and new prescriptions to the account unit', () => {
		expect(getProgressionSetPresentation(change.sets[0], 'LB', en)).toEqual({
			setLabel: 'Set 1',
			repsLabel: '11/10 reps',
			weightLabel: '220.46 → 225.97 lb',
		})
	})

	it('reads in Spanish, with a decimal comma', () => {
		expect(getProgressionRuleExplanation(change, 'KG', es, 'es')).toBe(
			'1 serie alcanzó el objetivo de repeticiones, así que cada carga prescrita subió 2,5 kg.',
		)
		expect(
			getProgressionRuleExplanation(
				{ ...change, sets: [change.sets[0], change.sets[0]] },
				'KG',
				es,
				'es',
			),
		).toBe(
			'Las 2 series alcanzaron sus objetivos de repeticiones, así que cada carga prescrita subió 2,5 kg.',
		)
		expect(
			getProgressionSetPresentation(change.sets[0], 'LB', es, 'es'),
		).toEqual({
			setLabel: 'Serie 1',
			repsLabel: '11/10 reps',
			weightLabel: '220,46 → 225,97 lb',
		})
	})

	it('keeps grouping out of large English loads', () => {
		expect(
			getProgressionSetPresentation(
				{ ...change.sets[0], previousWeightKg: 500, newWeightKg: 502.5 },
				'LB',
				en,
			).weightLabel,
		).toBe('1102.31 → 1107.82 lb')
	})
})
