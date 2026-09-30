import type {
	Routine,
	RoutineVersionExercise,
	RoutineVersionSetup,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	compareRoutineSetups,
	describeSetupSize,
	describeVersionOrigin,
	restoreBlockedReason,
	routineSetup,
	versionTitle,
} from './routine-versions'

const enVersions = translatorFor('en', 'routines.versions')
const enDate = translatorFor('en', 'routines.date')
const enFormat = translatorFor('en', 'routines.format')
const enSchedule = translatorFor('en', 'routines.schedule')
const esVersions = translatorFor('es', 'routines.versions')
const esDate = translatorFor('es', 'routines.date')
const esFormat = translatorFor('es', 'routines.format')
const esSchedule = translatorFor('es', 'routines.schedule')

const compare = (
	current: RoutineVersionSetup,
	target: RoutineVersionSetup,
	unit: 'KG' | 'LB' = 'KG',
) =>
	compareRoutineSetups(
		current,
		target,
		unit,
		enVersions,
		enDate,
		enSchedule,
		enFormat,
		'en',
	)

const compareEs = (
	current: RoutineVersionSetup,
	target: RoutineVersionSetup,
	unit: 'KG' | 'LB' = 'KG',
) =>
	compareRoutineSetups(
		current,
		target,
		unit,
		esVersions,
		esDate,
		esSchedule,
		esFormat,
		'es',
	)

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
		const comparison = compare(current, current)
		expect(comparison).toEqual({ routine: [], days: [], isEmpty: true })
		expect(
			restoreBlockedReason({
				comparison,
				versionCount: 1,
				max: 20,
				hasLiveSession: false,
				t: enVersions,
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
		const comparison = compare(current, target)
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
		const comparison = compare(rotation(80), rotation(100), 'LB')
		expect(comparison.routine).toEqual([])
		expect(comparison.days.map(day => day.title)).toEqual(['Upper', 'Lower'])
		expect(comparison.days[1].changes).toEqual(['Squat: 176.37 lb → 220.46 lb'])
	})

	it('names versions and blocks restores the server would refuse', () => {
		expect(versionTitle({ number: 3, name: null }, enVersions)).toBe(
			'Version 3',
		)
		expect(versionTitle({ number: 3, name: ' Block A ' }, enVersions)).toBe(
			'Block A',
		)
		expect(describeSetupSize(current, enVersions)).toBe('2 days · 3 exercises')
		expect(
			describeVersionOrigin(
				{ kind: 'BEFORE_RESTORE', restoredVersionNumber: 2 },
				enVersions,
			),
		).toBe('Saved automatically before restoring Version 2')
		expect(
			describeVersionOrigin(
				{ kind: 'SAVED', restoredVersionNumber: null },
				enVersions,
			),
		).toBeNull()

		const changed = compare(current, { ...current, name: 'Other' })
		const reason = (versionCount: number, hasLiveSession: boolean) =>
			restoreBlockedReason({
				comparison: changed,
				versionCount,
				max: 20,
				hasLiveSession,
				t: enVersions,
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
			rotationWeekdays: [],
			visibility: 'PRIVATE',
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
		expect(compare(setup, current).isEmpty).toBe(true)
	})

	it('says the same in Spanish (I18N-03)', () => {
		expect(versionTitle({ number: 3, name: null }, esVersions)).toBe(
			'Versión 3',
		)
		expect(describeSetupSize(current, esVersions)).toBe('2 días · 3 ejercicios')
		expect(
			describeSetupSize({ ...current, days: [current.days[0]] }, esVersions),
		).toBe('1 día · 2 ejercicios')
		expect(
			describeVersionOrigin(
				{ kind: 'BEFORE_RESTORE', restoredVersionNumber: 2 },
				esVersions,
			),
		).toBe('Guardada automáticamente antes de restaurar Versión 2')

		const comparisonEs = compareEs(current, {
			...current,
			name: 'Upper Lower v1',
		})
		expect(comparisonEs.routine[0]).toBe('Nombre: Upper Lower → Upper Lower v1')
		expect(
			restoreBlockedReason({
				comparison: comparisonEs,
				versionCount: 20,
				max: 20,
				hasLiveSession: false,
				t: esVersions,
			}),
		).toMatch(/Elimina una versión/)
	})
})
