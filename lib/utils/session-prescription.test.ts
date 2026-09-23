import type { WorkoutSession } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	sessionPrescription,
	sessionRoutineTitle,
} from './session-prescription'

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

	it('is nothing without a snapshot day', () => {
		expect(sessionPrescription({ routineDay: undefined })).toBeNull()
		expect(sessionPrescription(null)).toBeNull()
	})

	it('names the training block a session trained beside its routine', () => {
		const routine = { id: 'split', name: 'Upper / Lower' }
		expect(sessionRoutineTitle({ routine, trainingBlock: null })).toBe(
			'Upper / Lower',
		)
		expect(
			sessionRoutineTitle({
				routine,
				trainingBlock: {
					id: 'rev-2',
					seriesId: 's-1',
					revision: 2,
					name: 'Strength',
				},
			}),
		).toBe('Upper / Lower · Strength')
	})
})
