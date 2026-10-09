import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	allRequiredDone,
	matchesPrescription,
	type PlannedSet,
	prescriptionLine,
	sharedPrescription,
} from './session-focus'

const en = translatorFor('en', 'workout.prescriptionLine')
const es = translatorFor('es', 'workout.prescriptionLine')

const working = (overrides: Partial<PlannedSet> = {}): PlannedSet => ({
	setNumber: 1,
	kind: 'WORKING',
	isCompleted: false,
	plannedReps: 8,
	plannedWeight: 60,
	plannedRir: 2,
	...overrides,
})

describe('sharedPrescription', () => {
	it('states what every working set shares', () => {
		const sets = [1, 2, 3].map(setNumber => working({ setNumber }))
		expect(sharedPrescription(sets)).toEqual({
			count: 3,
			reps: { min: 8, max: 8 },
			weightKg: 60,
			rir: 2,
		})
	})

	it('reads a rep range and ignores warm-ups and extra sets', () => {
		const sets = [
			working({ kind: 'WARMUP', plannedReps: 10, plannedWeight: 20 }),
			working({
				setNumber: 2,
				plannedReps: null,
				plannedMinReps: 6,
				plannedMaxReps: 8,
			}),
			working({
				setNumber: 3,
				plannedReps: null,
				plannedMinReps: 6,
				plannedMaxReps: 8,
			}),
			working({
				setNumber: 4,
				isExtra: true,
				plannedReps: null,
				plannedWeight: null,
			}),
		]
		expect(sharedPrescription(sets)).toEqual({
			count: 2,
			reps: { min: 6, max: 8 },
			weightKg: 60,
			rir: 2,
		})
	})

	it('leaves out what the working sets do not share', () => {
		const sets = [
			working(),
			working({
				setNumber: 2,
				plannedReps: 6,
				plannedWeight: 65,
				plannedRir: 1,
			}),
		]
		expect(sharedPrescription(sets)).toEqual({
			count: 2,
			reps: null,
			weightKg: null,
			rir: null,
		})
	})

	it('has no weight when a set has none to state', () => {
		const sets = [
			working({ plannedWeight: null }),
			working({ setNumber: 2, plannedWeight: null }),
		]
		expect(sharedPrescription(sets)?.weightKg).toBeNull()
	})

	it('is null without a working set', () => {
		expect(sharedPrescription([working({ kind: 'WARMUP' })])).toBeNull()
	})
})

describe('matchesPrescription', () => {
	const line = sharedPrescription([working(), working({ setNumber: 2 })])

	it('lets a matching working set drop its captions', () => {
		expect(matchesPrescription(working(), line)).toEqual({
			reps: true,
			weight: true,
		})
	})

	it('keeps the captions of a set that differs or has another job', () => {
		expect(matchesPrescription(working({ plannedWeight: 62.5 }), line)).toEqual(
			{
				reps: true,
				weight: false,
			},
		)
		expect(matchesPrescription(working({ kind: 'WARMUP' }), line)).toEqual({
			reps: false,
			weight: false,
		})
		expect(matchesPrescription(working({ isExtra: true }), line)).toEqual({
			reps: false,
			weight: false,
		})
	})
})

describe('prescriptionLine', () => {
	const range = sharedPrescription([
		working({
			plannedReps: null,
			plannedMinReps: 6,
			plannedMaxReps: 8,
			plannedWeight: 57.5,
		}),
		working({
			setNumber: 2,
			plannedReps: null,
			plannedMinReps: 6,
			plannedMaxReps: 8,
			plannedWeight: 57.5,
		}),
		working({
			setNumber: 3,
			plannedReps: null,
			plannedMinReps: 6,
			plannedMaxReps: 8,
			plannedWeight: 57.5,
		}),
	])

	it('reads as one line in English', () => {
		expect(prescriptionLine(range, 120, 'KG', 'en', en)).toBe(
			'3 × 6–8 · 57.5 kg · RIR 2 · rest 2:00',
		)
	})

	it('reads in Spanish with the Spanish decimal mark', () => {
		expect(prescriptionLine(range, 90, 'KG', 'es', es)).toBe(
			'3 × 6–8 · 57,5 kg · RIR 2 · descanso 1:30',
		)
	})

	it('says how many sets when the reps differ, and drops a rest of 0:00', () => {
		const mixed = sharedPrescription([
			working({ plannedWeight: null, plannedRir: null }),
			working({
				setNumber: 2,
				plannedReps: 6,
				plannedWeight: null,
				plannedRir: null,
			}),
		])
		expect(prescriptionLine(mixed, 0, 'KG', 'en', en)).toBe('2 sets')
		expect(prescriptionLine(mixed, 0, 'KG', 'es', es)).toBe('2 series')
	})

	it('is null without a prescription', () => {
		expect(prescriptionLine(null, 120, 'KG', 'en', en)).toBeNull()
	})
})

describe('allRequiredDone', () => {
	it('needs every exercise done, warm-ups and optional sets aside', () => {
		const done = {
			sets: [
				working({ kind: 'WARMUP' }),
				working({ setNumber: 2, isCompleted: true }),
				working({ setNumber: 3, kind: 'OPTIONAL' }),
			],
		}
		const open = {
			sets: [working({ isCompleted: true }), working({ setNumber: 2 })],
		}
		expect(allRequiredDone([done])).toBe(true)
		expect(allRequiredDone([done, open])).toBe(false)
		expect(allRequiredDone([])).toBe(false)
	})
})
