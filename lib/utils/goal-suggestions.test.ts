import type { GoalSuggestion, MeasurableGoal } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	acceptSuggestionRequest,
	dashboardGoalsSummary,
	describeGoalSuggestion,
} from './goal-suggestions'

const en = translatorFor('en', 'progress.goalSuggestions')
const es = translatorFor('es', 'progress.goalSuggestions')
const enEx = translatorFor('en', 'catalog.exercises')
const esEx = translatorFor('es', 'catalog.exercises')
const enSummary = translatorFor('en', 'planning.dashboardSummaries')
const esSummary = translatorFor('es', 'planning.dashboardSummaries')

const sessions: GoalSuggestion = {
	key: 'WEEKLY_SESSIONS',
	type: 'WEEKLY_SESSIONS',
	targetValue: 4,
	direction: 'AT_LEAST',
	exercise: null,
	basis: { kind: 'PLAN', plannedWorkouts: 4, weekStart: '2026-09-28' },
}
const volume: GoalSuggestion = {
	key: 'WEEKLY_VOLUME',
	type: 'WEEKLY_VOLUME',
	targetValue: 22_000,
	direction: 'AT_LEAST',
	exercise: null,
	basis: {
		kind: 'RECENT_VOLUME',
		averageVolumeKg: 21_992,
		weeks: 4,
		activeWeeks: 3,
	},
}
const strength: GoalSuggestion = {
	key: 'EXERCISE_ESTIMATED_1RM:bench',
	type: 'EXERCISE_ESTIMATED_1RM',
	targetValue: 145,
	direction: 'AT_LEAST',
	exercise: { id: 'bench', name: 'Bench Press' },
	basis: {
		kind: 'BEST_ESTIMATED_1RM',
		bestEstimated1rmKg: 140,
		sessions: 6,
		windowDays: 56,
	},
}

describe('goal suggestions (ACH-06)', () => {
	it('says each suggestion and where its number came from', () => {
		expect(describeGoalSuggestion(sessions, 'KG', 'en', en, enEx)).toEqual({
			title: 'Train 4 times a week',
			basis: 'Your routines plan 4 workouts this week.',
		})
		expect(describeGoalSuggestion(volume, 'KG', 'en', en, enEx)).toEqual({
			title: 'Lift 22,000 kg a week',
			basis: 'Your last 4 weeks averaged 21,992 kg a week.',
		})
		expect(describeGoalSuggestion(strength, 'KG', 'en', en, enEx)).toEqual({
			title: 'Bench Press: an estimated 1RM of 145 kg',
			basis:
				'Your best is 140 kg, and you trained it in 6 workouts over the last 8 weeks.',
		})
	})

	it('reads in pounds and in Spanish', () => {
		expect(describeGoalSuggestion(strength, 'LB', 'en', en, enEx).title).toBe(
			'Bench Press: an estimated 1RM of 319.7 lb',
		)
		const single = {
			...sessions,
			targetValue: 1,
			basis: {
				...sessions.basis,
				plannedWorkouts: 1,
			} as GoalSuggestion['basis'],
		}
		expect(describeGoalSuggestion(single, 'KG', 'es', es, esEx)).toEqual({
			title: 'Entrenar 1 vez por semana',
			basis: 'Tus rutinas planifican 1 entrenamiento esta semana.',
		})
		expect(describeGoalSuggestion(volume, 'KG', 'es', es, esEx).title).toBe(
			'Levantar 22.000 kg por semana',
		)
	})

	it('adds the suggestion to the stored goals without changing them', () => {
		const stored: MeasurableGoal[] = [
			{
				id: 'g1',
				type: 'BODY_WEIGHT',
				targetValue: 80,
				direction: 'AT_MOST',
				exercise: null,
				createdAt: '2026-09-01T00:00:00.000Z',
				updatedAt: '2026-09-01T00:00:00.000Z',
			},
			{
				id: 'g2',
				type: 'STREAK_DAYS',
				targetValue: 10,
				direction: 'AT_LEAST',
				exercise: null,
				createdAt: '2026-09-02T00:00:00.000Z',
				updatedAt: '2026-09-02T00:00:00.000Z',
			},
		]
		expect(acceptSuggestionRequest(stored, strength)).toEqual({
			goals: [
				{
					id: 'g1',
					type: 'BODY_WEIGHT',
					targetValue: 80,
					direction: 'AT_MOST',
				},
				{
					id: 'g2',
					type: 'STREAK_DAYS',
					targetValue: 10,
					direction: 'AT_LEAST',
				},
				{
					type: 'EXERCISE_ESTIMATED_1RM',
					targetValue: 145,
					direction: 'AT_LEAST',
					exerciseId: 'bench',
				},
			],
		})
	})
})

describe('the dashboard goals line (DASH-04)', () => {
	it('counts goals reached, else the suggestions waiting', () => {
		expect(
			dashboardGoalsSummary(
				[{ achieved: true }, { achieved: false }, { achieved: null }],
				2,
				enSummary,
				'en',
			),
		).toBe('Goals reached: 1 of 3')
		expect(dashboardGoalsSummary([], 2, enSummary, 'en')).toBe(
			'2 suggested goals',
		)
		expect(dashboardGoalsSummary(undefined, 1, esSummary, 'es')).toBe(
			'1 objetivo sugerido',
		)
		expect(dashboardGoalsSummary([], 0, enSummary, 'en')).toBeNull()
	})
})
