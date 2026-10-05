import type { WorkoutSession } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	sessionPrescription,
	sessionRoutineTitle,
} from './session-prescription'

const en = translatorFor('en', 'workout.prescription')
const es = translatorFor('es', 'workout.prescription')

const snapshotDay: NonNullable<WorkoutSession['routineDay']> = {
	id: 'block-thu',
	name: 'Heavy',
	order: 0,
	dayOfWeek: 4,
	exercises: [
		{
			id: 'slot-1',
			order: 0,
			restSeconds: 180,
			note: null,
			progressionScheme: 'DOUBLE_PROGRESSION',
			minWeightIncrement: 2.5,
			exercise: {
				id: 'squat',
				name: 'Back Squat',
				primaryMuscles: ['QUADRICEPS'],
			},
			sets: [
				{
					id: 'set-1',
					setNumber: 1,
					repType: 'FIXED',
					reps: 5,
					weight: 140,
					rir: 2,
				},
			],
		},
	],
}

describe('session prescription (ROUT-15)', () => {
	it('is the session snapshot day, with its slot ids and loads', () => {
		const day = sessionPrescription({ routineDay: snapshotDay })
		expect(day?.id).toBe('block-thu')
		expect(day?.exercises[0].id).toBe('slot-1')
		expect(day?.exercises[0].restSeconds).toBe(180)
		expect(day?.exercises[0].sets[0]).toMatchObject({
			setNumber: 1,
			weight: 140,
		})
	})

	it('keeps an LP slot’s block as the workout started, and null elsewhere (ROUT-17)', () => {
		const block = {
			referenceMaxKg: 100,
			phase: 'BLOCK' as const,
			step: 3,
			cycle: 1,
			samples: [],
		}
		const day = sessionPrescription({
			routineDay: {
				...snapshotDay,
				exercises: [
					{
						...snapshotDay.exercises[0],
						progressionScheme: 'LINEAR_PERIODIZATION',
						linearPeriodization: block,
					},
					{ ...snapshotDay.exercises[0], id: 'slot-2', order: 1 },
				],
			},
		})
		expect(day?.exercises[0].linearPeriodization).toEqual(block)
		expect(day?.exercises[1].linearPeriodization).toBeNull()
	})

	it('is nothing without a snapshot day', () => {
		expect(sessionPrescription({ routineDay: undefined })).toBeNull()
		expect(sessionPrescription(null)).toBeNull()
	})

	it('names the training block a session trained beside its routine', () => {
		const routine = { id: 'split', name: 'Upper / Lower' }
		expect(sessionRoutineTitle({ routine, trainingBlock: null }, en)).toBe(
			'Upper / Lower',
		)
		expect(
			sessionRoutineTitle(
				{
					routine,
					trainingBlock: {
						id: 'rev-2',
						seriesId: 's-1',
						revision: 2,
						name: 'Strength',
					},
				},
				en,
			),
		).toBe('Upper / Lower · Strength')
	})

	it('falls back to a generic workout title and says the same in Spanish (I18N-04)', () => {
		expect(
			sessionRoutineTitle({ routine: undefined, trainingBlock: null }, en),
		).toBe('Workout')
		expect(
			sessionRoutineTitle({ routine: undefined, trainingBlock: null }, es),
		).toBe('Entrenamiento')
		expect(
			sessionRoutineTitle(
				{
					routine: { id: 'split', name: 'Upper / Lower' },
					trainingBlock: null,
					temporaryOverride: { id: 'deload-1', kind: 'DELOAD' },
				} as never,
				es,
			),
		).toBe('Upper / Lower · Descarga')
	})
})
