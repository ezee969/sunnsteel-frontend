import { describe, expect, it } from 'vitest'

import type { RoutineExercise } from '@/lib/api/types/routine.type'
import type { SetLog, WorkoutSession } from '@/lib/api/types/workout.type'

import { buildExerciseGroups } from './exercise-groups'
import {
	areAllSetsCompleted,
	calculateExerciseCompletion,
	calculateSessionProgress,
	extraSetLogs,
	groupSetLogsByExercise,
} from './session-progress.utils'

const bench = {
	id: 'slot-bench',
	order: 0,
	restSeconds: 120,
	progressionScheme: 'DOUBLE_PROGRESSION',
	minWeightIncrement: 2.5,
	exercise: { id: 'bench', name: 'Bench Press', primaryMuscles: ['PECTORAL'] },
	sets: [
		{
			id: 'set-1',
			setNumber: 1,
			repType: 'FIXED',
			reps: 8,
			weight: 80,
			rir: 2,
		},
		{
			id: 'set-2',
			setNumber: 2,
			repType: 'FIXED',
			reps: 8,
			weight: 80,
			rir: 2,
		},
	],
} as unknown as RoutineExercise

const log = (
	setNumber: number,
	isCompleted: boolean,
	overrides: Partial<SetLog> = {},
): SetLog => ({
	id: `log-${setNumber}`,
	sessionId: 'session-1',
	routineExerciseId: 'slot-bench',
	exerciseId: 'bench',
	setNumber,
	reps: 8,
	weight: 80,
	rpe: 8,
	isCompleted,
	kind: 'WORKING',
	createdAt: '2026-09-24T08:00:00.000Z',
	updatedAt: '2026-09-24T08:00:00.000Z',
	...overrides,
})

describe('extra sets on the live session (LIVE-15)', () => {
	it('adds sets logged beyond the prescription after it, without targets', () => {
		const logs = [log(4, false, { reps: 6 }), log(1, true), log(3, true)]
		const [group] = groupSetLogsByExercise(logs, [bench], 'session-1')

		expect(group.sets.map(set => [set.setNumber, set.isExtra])).toEqual([
			[1, false],
			[2, false],
			[3, true],
			[4, true],
		])
		expect(group.sets[3]).toMatchObject({
			reps: 6,
			weight: 80,
			rpe: 8,
			plannedReps: null,
			plannedWeight: null,
			plannedRir: null,
		})
	})

	it('leaves a slot without extras exactly as prescribed', () => {
		const [group] = groupSetLogsByExercise([log(1, true)], [bench], 's')
		expect(group.sets).toHaveLength(2)
		expect(extraSetLogs([log(2, true)], bench)).toEqual([])
	})

	it('counts extras in progress and in the finish check', () => {
		const logs = [log(1, true), log(2, true), log(3, false)]

		expect(calculateSessionProgress(logs, [bench])).toEqual({
			totalSets: 3,
			completedSets: 2,
			percentage: 67,
		})
		expect(calculateExerciseCompletion(logs, bench)).toMatchObject({
			completedSets: 2,
			totalSets: 3,
			isCompleted: false,
		})
		expect(areAllSetsCompleted(logs, [bench])).toBe(false)
		expect(
			areAllSetsCompleted([log(1, true), log(2, true), log(3, true)], [bench]),
		).toBe(true)
	})

	it('ignores another exercise’s logs', () => {
		const other = log(3, false, { routineExerciseId: 'slot-row' })
		expect(extraSetLogs([other], bench)).toEqual([])
		expect(calculateSessionProgress([other], [bench]).totalSets).toBe(2)
	})
})

describe('extra sets in history (LIVE-15)', () => {
	it('lists the sets beyond the prescription separately, in order', () => {
		const session = {
			id: 'session-1',
			routineDay: { exercises: [bench] },
			setLogs: [log(4, true), log(1, true), log(3, false)],
		} as unknown as WorkoutSession

		const [group] = buildExerciseGroups(session)
		expect(group.extraSets.map(set => set.setNumber)).toEqual([3, 4])
		expect(group.performedSets).toHaveLength(3)
	})
})
