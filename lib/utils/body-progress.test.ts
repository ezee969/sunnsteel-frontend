import type { BodyMeasurement, MeasurableGoal } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	bodyEntryRequest,
	bodyFieldLabel,
	bodyWeightPoints,
	describeBodyChange,
	describeBodyEntry,
	describeBodyWeightGoal,
	draftFromBodyEntry,
	emptyBodyEntryDraft,
	formatBodyChange,
	formatBodyValue,
	getBodyWeightChart,
} from './body-progress'

const entry = (
	date: string,
	values: Partial<BodyMeasurement>,
): BodyMeasurement => ({
	date,
	weightKg: null,
	waistCm: null,
	hipsCm: null,
	chestCm: null,
	armCm: null,
	thighCm: null,
	bodyFatPercent: null,
	updatedAt: `${date}T08:00:00.000Z`,
	...values,
})

const goal = (
	targetValue: number,
	direction: 'AT_MOST' | 'AT_LEAST',
): MeasurableGoal => ({
	id: 'g',
	type: 'BODY_WEIGHT',
	targetValue,
	direction,
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-01T00:00:00.000Z',
})

const en = translatorFor('en', 'progress.body')
const es = translatorFor('es', 'progress.body')

describe('body progress wording', () => {
	it("shows weight in the account's unit and lengths in cm", () => {
		expect(formatBodyValue('weightKg', 80, 'KG')).toBe('80 kg')
		expect(formatBodyValue('weightKg', 80, 'LB')).toBe('176.4 lb')
		expect(formatBodyValue('waistCm', 84.25, 'LB')).toBe('84.3 cm')
		expect(formatBodyValue('bodyFatPercent', 18, 'KG')).toBe('18%')
	})

	it('signs a change and calls a rounded-away one no change', () => {
		expect(formatBodyChange('weightKg', -1.5, 'KG', en)).toBe('-1.5 kg')
		expect(formatBodyChange('waistCm', 2, 'KG', en)).toBe('+2 cm')
		expect(formatBodyChange('weightKg', 0.01, 'LB', en)).toBe('No change')
		expect(
			describeBodyChange(
				{
					field: 'weightKg',
					latest: 78.5,
					latestDate: '2026-09-20',
					change: -1.5,
					changeSince: '2026-09-01',
				},
				'KG',
				en,
				'en',
			),
		).toBe('-1.5 kg since Sep 1, 2026')
		expect(
			describeBodyChange(
				{
					field: 'waistCm',
					latest: 90,
					latestDate: '2026-09-01',
					change: null,
					changeSince: null,
				},
				'KG',
				en,
				'en',
			),
		).toBeNull()
	})

	it('names every value an entry records', () => {
		expect(
			describeBodyEntry(
				entry('2026-09-01', { weightKg: 80, waistCm: 90 }),
				'KG',
				en,
			),
		).toBe('80 kg · Waist 90 cm')
	})
})

describe('the weight chart', () => {
	it('plots only weighted entries and keeps the goal line inside the scale', () => {
		const points = bodyWeightPoints([
			entry('2026-09-01', { weightKg: 80 }),
			entry('2026-09-05', { waistCm: 90 }),
			entry('2026-09-10', { weightKg: 79 }),
		])
		expect(points.map(point => point.date)).toEqual([
			'2026-09-01',
			'2026-09-10',
		])
		const chart = getBodyWeightChart(points, 75, 640, 220, 24)
		expect(chart.coordinates[0].x).toBe(24)
		expect(chart.coordinates[1].x).toBe(616)
		expect(chart.coordinates[0].y).toBe(24)
		expect(chart.goalY).toBe(196)
	})

	it('centres a single point', () => {
		const chart = getBodyWeightChart(
			[{ date: '2026-09-01', weightKg: 80 }],
			null,
			640,
			220,
			24,
		)
		expect(chart.coordinates[0]).toMatchObject({ x: 320, y: 110 })
		expect(chart.goalY).toBeNull()
	})
})

describe('the body-weight goal', () => {
	it('reads an at-most goal as the weight still to lose', () => {
		expect(
			describeBodyWeightGoal([goal(75, 'AT_MOST')], 78.5, 'KG', en),
		).toMatchObject({
			target: 'Goal: at most 75 kg',
			gap: '3.5 kg to go',
			reached: false,
		})
		expect(
			describeBodyWeightGoal([goal(75, 'AT_MOST')], 74, 'KG', en)?.gap,
		).toBe('Goal reached')
	})

	it('reads an at-least goal the other way, and nothing without a goal', () => {
		expect(
			describeBodyWeightGoal([goal(85, 'AT_LEAST')], 80, 'KG', en)?.gap,
		).toBe('5 kg to go')
		expect(describeBodyWeightGoal([], 80, 'KG', en)).toBeNull()
		expect(
			describeBodyWeightGoal([goal(85, 'AT_LEAST')], null, 'KG', en)?.gap,
		).toBe('Log a weight to compare')
	})
})

describe('the entry form', () => {
	it('sends weight back in kilograms and clears the fields left empty', () => {
		const draft = {
			...emptyBodyEntryDraft('2026-09-20'),
			weightKg: '176.37',
			waistCm: '84',
		}
		const result = bodyEntryRequest(draft, 'LB', '2026-09-27', en)
		expect(result.problem).toBeNull()
		expect(result.request?.weightKg).toBeCloseTo(80, 2)
		expect(result.request).toMatchObject({
			waistCm: 84,
			hipsCm: null,
			bodyFatPercent: null,
		})
	})

	it('round-trips an entry through the form', () => {
		const draft = draftFromBodyEntry(
			entry('2026-09-20', { weightKg: 80, bodyFatPercent: 18 }),
			'KG',
		)
		expect(draft).toMatchObject({
			weightKg: '80',
			bodyFatPercent: '18',
			waistCm: '',
		})
	})

	it('refuses what the server would, naming the field', () => {
		const today = '2026-09-27'
		expect(
			bodyEntryRequest(emptyBodyEntryDraft('2026-09-20'), 'KG', today, en),
		).toMatchObject({
			problem: 'Add at least one measurement',
			field: null,
		})
		expect(
			bodyEntryRequest(
				{ ...emptyBodyEntryDraft('2026-09-20'), weightKg: '5' },
				'LB',
				today,
				en,
			),
		).toMatchObject({
			problem: 'Weight must be between 44.1 lb and 2,204.6 lb',
			field: 'weightKg',
		})
		expect(
			bodyEntryRequest(
				{ ...emptyBodyEntryDraft('2026-09-20'), waistCm: 'abc' },
				'KG',
				today,
				en,
			),
		).toMatchObject({ problem: 'Waist must be a number', field: 'waistCm' })
		expect(
			bodyEntryRequest(
				{ ...emptyBodyEntryDraft('2026-09-30'), waistCm: '80' },
				'KG',
				today,
				en,
			),
		).toMatchObject({ field: 'date' })
	})
})

describe('the same body copy in Spanish (I18N-05)', () => {
	it('names every field and agrees the entry count', () => {
		expect(bodyFieldLabel('waistCm', es)).toBe('Cintura')
		expect(bodyFieldLabel('bodyFatPercent', es)).toBe('Grasa corporal')
		expect(
			describeBodyEntry(
				entry('2026-09-01', { weightKg: 80, waistCm: 90 }),
				'KG',
				es,
			),
		).toBe('80 kg · Cintura 90 cm')
		expect(formatBodyChange('weightKg', 0, 'KG', es)).toBe('Sin cambios')
	})
})
