import type { ProgressionChange } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

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

describe('progression change presentation', () => {
	it('explains the all-sets rule and canonical increment', () => {
		expect(getProgressionRuleExplanation(change, 'KG')).toBe(
			'All 1 set reached the rep target, so every prescribed load advanced by 2.5 kg.',
		)
	})

	it('explains per-set progression with correct pluralisation', () => {
		expect(
			getProgressionRuleExplanation(
				{ ...change, rule: 'SET_REACHED_TARGET' },
				'KG',
			),
		).toBe('1 set reached the rep target and advanced independently by 2.5 kg.')
	})

	it('converts both old and new prescriptions to the account unit', () => {
		expect(getProgressionSetPresentation(change.sets[0], 'LB')).toEqual({
			setLabel: 'Set 1',
			repsLabel: '11/10 reps',
			weightLabel: '220.46 → 225.97 lb',
		})
	})
})
