import type { MeasurableGoal } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	buildMeasurableGoalsRequest,
	convertMeasurableGoalDrafts,
	createMeasurableGoalDraft,
	measurableGoalsToDrafts,
} from './measurable-goals'

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
		const request = buildMeasurableGoalsRequest([draft], 'LB')
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

	it('requires integer counts, selected exercises and unique goals', () => {
		expect(() =>
			buildMeasurableGoalsRequest(
				[{ ...createMeasurableGoalDraft(), target: '2.5' }],
				'KG',
			),
		).toThrow('Check the target')
		expect(() =>
			buildMeasurableGoalsRequest(
				[
					{
						...createMeasurableGoalDraft('EXERCISE_ESTIMATED_1RM'),
						target: '100',
					},
				],
				'KG',
			),
		).toThrow('Choose an exercise')
		expect(() =>
			buildMeasurableGoalsRequest(
				[
					{ ...createMeasurableGoalDraft(), target: '3' },
					{ ...createMeasurableGoalDraft(), target: '4' },
				],
				'KG',
			),
		).toThrow('unique')
	})
})
