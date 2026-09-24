import type {
	RoutineVersionSetup,
	SetKind,
	WeightUnit,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import type { RoutineWizardData } from '@/features/routines/wizard/types'
import { computeWeeklyMuscleSets } from '@/features/routines/wizard/utils/routine-quality'
import { buildRoutineRequest } from '@/features/routines/wizard/utils/routine-summary'
import {
	isWeightLocked,
	leadSetIndex,
	syncLeadWeight,
} from '@/features/routines/wizard/utils/set-kinds'
import type { Exercise } from '@/lib/api/types'
import type { RoutineExercise } from '@/lib/api/types/routine.type'
import type { SetLog } from '@/lib/api/types/workout.type'

import { compareRoutineSetups } from './routine-versions'
import {
	areAllSetsCompleted,
	groupSetLogsByExercise,
} from './session-progress.utils'

const kinded = (kinds: SetKind[], weight = 80) =>
	kinds.map((kind, index) => ({
		setNumber: index + 1,
		repType: 'FIXED' as const,
		reps: 8,
		weight: kind === 'WARMUP' ? 40 : weight,
		kind,
	}))

describe('the builder under double progression (LIVE-12)', () => {
	it('leads with the first working set and leaves warm-ups and drops free', () => {
		const sets = kinded(['WARMUP', 'WORKING', 'WORKING', 'DROP'])
		expect(leadSetIndex(sets)).toBe(1)
		expect(
			sets.map((_, index) => isWeightLocked(sets, index, 'DOUBLE_PROGRESSION')),
		).toEqual([false, false, true, false])
		expect(isWeightLocked(sets, 2, 'NONE')).toBe(false)
	})

	it('copies the lead load onto the other working sets only', () => {
		const sets = kinded(['WARMUP', 'WORKING', 'WORKING', 'DROP'])
		sets[1].weight = 100
		sets[3].weight = 60
		syncLeadWeight(sets, 'DOUBLE_PROGRESSION')
		expect(sets.map(set => set.weight)).toEqual([40, 100, 100, 60])
	})
})

describe('the builder sends every kind (LIVE-12)', () => {
	it('sends working for a set that has none, so an edit back sticks', () => {
		const data = {
			name: 'Upper',
			scheduleMode: 'WEEKLY',
			restDays: [],
			rotationWeekdays: [],
			days: [
				{
					slot: 1,
					name: '',
					exercises: [
						{
							exerciseId: 'bench',
							progressionScheme: 'NONE',
							minWeightIncrement: 2.5,
							restSeconds: 90,
							sets: [
								{ setNumber: 1, repType: 'FIXED', reps: 5, kind: 'WARMUP' },
								{ setNumber: 2, repType: 'FIXED', reps: 5 },
							],
						},
					],
				},
			],
		} as unknown as RoutineWizardData
		const request = buildRoutineRequest(data)
		expect(request.days[0].exercises[0].sets.map(set => set.kind)).toEqual([
			'WARMUP',
			'WORKING',
		])
	})
})

describe('weekly muscle sets leave warm-ups out (LIVE-12)', () => {
	it('counts only the sets of work', () => {
		const data = {
			days: [
				{
					exercises: [
						{
							exerciseId: 'bench',
							sets: kinded(['WARMUP', 'WARMUP', 'WORKING', 'WORKING']),
						},
					],
				},
			],
		} as unknown as RoutineWizardData
		const catalog = {
			bench: {
				id: 'bench',
				primaryMuscles: ['PECTORAL'],
				secondaryMuscles: [],
			},
		} as unknown as Record<string, Exercise>
		expect(computeWeeklyMuscleSets(data, catalog)).toEqual([
			{ muscle: 'PECTORAL', sets: 2 },
		])
	})
})

const bench = {
	id: 'slot-bench',
	order: 0,
	restSeconds: 90,
	progressionScheme: 'NONE',
	minWeightIncrement: 2.5,
	exercise: { id: 'bench', name: 'Bench Press', primaryMuscles: ['PECTORAL'] },
	sets: [
		{ id: 's1', setNumber: 1, repType: 'FIXED', reps: 5, kind: 'WARMUP' },
		{ id: 's2', setNumber: 2, repType: 'FIXED', reps: 8 },
		{ id: 's3', setNumber: 3, repType: 'FIXED', reps: 8, kind: 'OPTIONAL' },
		{ id: 's4', setNumber: 4, repType: 'FIXED', reps: 12, kind: 'DROP' },
	],
} as unknown as RoutineExercise

const log = (setNumber: number, isCompleted = true, kind?: SetKind) =>
	({
		id: `log-${setNumber}`,
		sessionId: 'session-1',
		routineExerciseId: 'slot-bench',
		exerciseId: 'bench',
		setNumber,
		reps: 8,
		weight: 80,
		isCompleted,
		kind,
		createdAt: '2026-09-24T08:00:00.000Z',
		updatedAt: '2026-09-24T08:00:00.000Z',
	}) as SetLog

describe('the live session reads each set as it is done (LIVE-12)', () => {
	it('takes the log kind first, then the prescription, then working', () => {
		const [group] = groupSetLogsByExercise(
			[log(2, true, 'DROP'), log(5, false)],
			[bench],
			'session-1',
		)
		expect(group.sets.map(set => [set.setNumber, set.kind])).toEqual([
			[1, 'WARMUP'],
			[2, 'DROP'],
			[3, 'OPTIONAL'],
			[4, 'DROP'],
			[5, 'WORKING'],
		])
	})

	it('finishes without warm-ups or optional sets, but not without a drop', () => {
		expect(areAllSetsCompleted([log(2), log(4)], [bench])).toBe(true)
		expect(areAllSetsCompleted([log(2)], [bench])).toBe(false)
		expect(
			areAllSetsCompleted([log(2), log(4, true, 'OPTIONAL')], [bench]),
		).toBe(true)
	})
})

describe('versions name a change of set kinds (LIVE-12)', () => {
	it('states the kinds before and after', () => {
		const setup = (kinds: SetKind[]) =>
			({
				name: 'Upper',
				description: null,
				scheduleMode: 'WEEKLY',
				restDays: [],
				rotationWeekdays: [],
				days: [
					{
						dayOfWeek: 1,
						name: null,
						order: 0,
						exercises: [
							{
								exercise: { id: 'bench', name: 'Bench Press' },
								order: 0,
								restSeconds: 90,
								note: null,
								progressionScheme: 'NONE',
								minWeightIncrement: 2.5,
								sets: kinded(kinds, 80).map(set => ({ ...set, weight: 80 })),
							},
						],
					},
				],
			}) as unknown as RoutineVersionSetup
		const result = compareRoutineSetups(
			setup(['WORKING', 'WORKING', 'WORKING']),
			setup(['WARMUP', 'WORKING', 'WORKING']),
			'KG' as WeightUnit,
		)
		expect(JSON.stringify(result.days)).toContain(
			'Bench Press: 3 working → 1 warm-up, 2 working sets',
		)
	})
})
