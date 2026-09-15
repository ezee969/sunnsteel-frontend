import type {
	Routine,
	RoutineVersionExercise,
	RoutineVersionSetup,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	compareRoutineSetups,
	describeSetupSize,
	describeVersionOrigin,
	restoreBlockedReason,
	routineSetup,
	versionTitle,
} from './routine-versions'

const exercise = (
	id: string,
	name: string,
	order: number,
	overrides: Partial<RoutineVersionExercise> = {},
): RoutineVersionExercise => ({
	exercise: { id, name },
	order,
	restSeconds: 90,
	note: null,
	progressionScheme: 'DOUBLE_PROGRESSION',
	minWeightIncrement: 2.5,
	sets: [1, 2, 3].map(setNumber => ({
		setNumber,
		repType: 'RANGE' as const,
		reps: null,
		minReps: 6,
		maxReps: 8,
		weight: 80,
		rir: 2,
	})),
	...overrides,
})

const current: RoutineVersionSetup = {
	name: 'Upper Lower',
	description: null,
	scheduleMode: 'WEEKLY',
	restDays: [0],
	days: [
		{
			dayOfWeek: 1,
			name: 'Upper',
			order: 0,
			exercises: [
				exercise('bench', 'Bench Press', 0),
				exercise('row', 'Barbell Row', 1),
			],
		},
		{
			dayOfWeek: 3,
			name: 'Lower',
			order: 1,
			exercises: [exercise('squat', 'Squat', 0)],
		},
	],
}

describe('routine versions', () => {
	it('matches the current routine to a version with no changes', () => {
		const comparison = compareRoutineSetups(current, current, 'KG')
		expect(comparison).toEqual({ routine: [], days: [], isEmpty: true })
		expect(
			restoreBlockedReason({
				comparison,
				versionCount: 1,
				max: 20,
				hasLiveSession: false,
			}),
		).toMatch(/matches/)
	})

	it('describes what restoring would change, exercise by exercise', () => {
		const target: RoutineVersionSetup = {
			...current,
			name: 'Upper Lower v1',
			days: [
				{
					...current.days[0],
					exercises: [
						// Row moves first and Bench loses a set and gains load.
						exercise('row', 'Barbell Row', 0, { restSeconds: 120 }),
						exercise('bench', 'Bench Press', 1, {
							note: 'Pause',
							sets: exercise('bench', 'Bench Press', 1)
								.sets.slice(0, 2)
								.map(set => ({ ...set, weight: 85 })),
						}),
						exercise('dips', 'Dips', 2),
					],
				},
				{
					dayOfWeek: 5,
					name: null,
					order: 1,
					exercises: [exercise('deadlift', 'Deadlift', 0)],
				},
			],
		}
		const comparison = compareRoutineSetups(current, target, 'KG')
		expect(comparison.isEmpty).toBe(false)
		expect(comparison.routine[0]).toBe('Name: Upper Lower → Upper Lower v1')
		expect(comparison.routine[1]).toMatch(/^Schedule: .*Wed.* → .*Fri/)

		const upper = comparison.days.find(day => day.status === 'CHANGED')!
		expect(upper.changes).toEqual([
			'Barbell Row: rest 90 s → 120 s',
			'Bench Press: 3 × 6–8 → 2 × 6–8',
			'Bench Press: 80 kg → 85 kg',
			'Bench Press: note becomes “Pause”',
			'Adds Dips (3 × 6–8)',
			'Exercise order changes',
		])
		expect(
			comparison.days
				.filter(day => day.status !== 'CHANGED')
				.map(day => [day.status, day.changes[0]]),
		).toEqual([
			['ADDED', 'Adds this day with 1 exercise'],
			['REMOVED', 'Removes this day'],
		])
	})

	it('matches rotation days by position and shows loads in pounds', () => {
		const rotation = (weight: number): RoutineVersionSetup => ({
			...current,
			scheduleMode: 'ROTATION',
			restDays: [],
			days: current.days.map(day => ({
				...day,
				dayOfWeek: null,
				exercises: day.exercises.map(item => ({
					...item,
					sets: item.sets.map(set => ({ ...set, weight })),
				})),
			})),
		})
		const comparison = compareRoutineSetups(rotation(80), rotation(100), 'LB')
		expect(comparison.routine).toEqual([])
		expect(comparison.days.map(day => day.title)).toEqual(['Upper', 'Lower'])
		expect(comparison.days[1].changes).toEqual(['Squat: 176.37 lb → 220.46 lb'])
	})

	it('names versions and blocks restores the server would refuse', () => {
		expect(versionTitle({ number: 3, name: null })).toBe('Version 3')
		expect(versionTitle({ number: 3, name: ' Block A ' })).toBe('Block A')
		expect(describeSetupSize(current)).toBe('2 days · 3 exercises')
		expect(
			describeVersionOrigin({
				kind: 'BEFORE_RESTORE',
				restoredVersionNumber: 2,
			}),
		).toBe('Saved automatically before restoring Version 2')
		expect(
			describeVersionOrigin({ kind: 'SAVED', restoredVersionNumber: null }),
		).toBeNull()

		const changed = compareRoutineSetups(
			current,
			{ ...current, name: 'Other' },
			'KG',
		)
		const reason = (versionCount: number, hasLiveSession: boolean) =>
			restoreBlockedReason({
				comparison: changed,
				versionCount,
				max: 20,
				hasLiveSession,
			})
		expect(reason(3, false)).toBeNull()
		expect(reason(3, true)).toMatch(/workout in progress/)
		expect(reason(20, false)).toMatch(/Delete a version/)
	})

	it('reads the current routine in a version shape', () => {
		const routine = {
			id: 'r1',
			userId: 'u1',
			name: 'Upper Lower',
			description: null,
			isPeriodized: false,
			isFavorite: false,
			isCompleted: false,
			scheduleMode: 'WEEKLY',
			nextRotationDayId: null,
			restDays: [0],
			createdAt: '2026-09-01T00:00:00.000Z',
			updatedAt: '2026-09-01T00:00:00.000Z',
			days: current.days.map((day, index) => ({
				...day,
				id: `day-${index}`,
				exercises: day.exercises.map((item, position) => ({
					...item,
					id: `re-${index}-${position}`,
					exercise: { ...item.exercise, primaryMuscles: [] },
				})),
			})),
		} as Routine
		const setup = routineSetup(routine)
		expect(setup.days[0].exercises[0].exercise).toEqual({
			id: 'bench',
			name: 'Bench Press',
		})
		expect(compareRoutineSetups(setup, current, 'KG').isEmpty).toBe(true)
	})
})
