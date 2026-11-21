import { describe, expect, it } from 'vitest'

import { bodyMapLevel } from '@/lib/utils/body-map'

import {
	LANDING_FACTS,
	LEDGER_RANGE,
	LEDGER_ROWS,
	MUSCLE_WEEKS,
	nextDoubleProgressionWeight,
	PLAN_TEMPLATE,
	STRENGTH_EXAMPLE,
	strengthChange,
	templatesForLevel,
	templateWeekdays,
	TRAIN_EXAMPLE,
} from './landing-examples'

describe('the landing examples (SITE-01)', () => {
	it('opens the Upper / Lower template, four days a week', () => {
		expect(PLAN_TEMPLATE.slug).toBe('upper-lower')
		expect(PLAN_TEMPLATE.days).toHaveLength(4)
	})

	it('loads 100 kg as 25 + 15 a side with the bar ramp of §12.4', () => {
		expect(TRAIN_EXAMPLE.platesPerSide).toEqual([25, 15])
		expect(TRAIN_EXAMPLE.ramp).toEqual([
			{ weightKg: 20, reps: 10 },
			{ weightKg: 40, reps: 5 },
			{ weightKg: 60, reps: 3 },
			{ weightKg: 80, reps: 2 },
		])
	})

	it('raises bench press 4 kg over eight weeks, ending at 102 kg', () => {
		const values = STRENGTH_EXAMPLE.weeklyE1rmKg
		expect(values).toHaveLength(8)
		expect(values[values.length - 1]).toBe(102)
		expect(strengthChange(values)).toBe(4)
	})

	it('runs the ledger through the double progression rule', () => {
		for (let row = 1; row < LEDGER_ROWS.length; row += 1) {
			const before = LEDGER_ROWS[row - 1]
			expect(LEDGER_ROWS[row].weightKg).toBe(
				nextDoubleProgressionWeight(
					before.weightKg,
					before.reps,
					LEDGER_RANGE.max,
					LANDING_FACTS.step,
				),
			)
		}
		// Only the workout where every set reached 12 moved the weight.
		expect(LEDGER_ROWS.at(-1)?.weightKg).toBe(82.5)
	})

	it('crosses bands as the four weeks pass, inside the free window', () => {
		expect(MUSCLE_WEEKS).toHaveLength(LANDING_FACTS.muscleWeeksFree)
		const levels = (muscle: 'PECTORAL' | 'CALVES' | 'CORE') =>
			MUSCLE_WEEKS.map(week => bodyMapLevel(week[muscle] ?? 0))
		expect(new Set(levels('PECTORAL')).size).toBeGreaterThan(1)
		expect(levels('CALVES')[0]).toBe(0)
		expect(levels('CORE').at(-1)).toBeGreaterThan(0)
	})

	it('quotes the numbers contracts and the app keep', () => {
		expect(LANDING_FACTS).toMatchObject({
			step: 2.5,
			groupMax: 6,
			partnersMax: 20,
			privacyParts: 10,
			messageContext: 5,
			revocationDays: 10,
			trialDays: 7,
			ranks: 6,
			muscleWeeksFree: 4,
			muscleWeeksPro: 12,
			freeVersions: 3,
			freeGoals: 3,
			freeGyms: 1,
			proDrafts: 10,
			proReviews: 20,
		})
	})

	it('offers one beginner, two intermediate and no advanced template', () => {
		expect(templatesForLevel('beginner').map(t => t.slug)).toEqual([
			'full-body-foundations',
		])
		expect(templatesForLevel('intermediate').map(t => t.slug)).toEqual([
			'upper-lower',
			'push-pull-legs',
		])
		expect(templatesForLevel('advanced')).toEqual([])
	})

	it('lights a rotation Monday to Saturday and a weekly plan by its days', () => {
		const [ppl] = templatesForLevel('intermediate').slice(1)
		expect(templateWeekdays(ppl)).toEqual([1, 2, 3, 4, 5, 6])
		expect(templateWeekdays(PLAN_TEMPLATE)).toEqual([1, 2, 4, 5])
	})
})
