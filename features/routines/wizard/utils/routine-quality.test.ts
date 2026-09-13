import type { TrainingLocationPreference } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import type { Exercise } from '@/lib/api/types'

import type { RoutineWizardData, RoutineWizardExercise } from '../types'
import {
	buildRoutineQualitySummary,
	checkEquipmentAtLocation,
	computeRoutineEquipment,
	computeWeeklyMuscleSets,
	estimateDaySeconds,
	findLikelyImbalances,
	formatSetCount,
} from './routine-quality'

const exercise = (
	id: string,
	fields: Partial<Exercise> & Pick<Exercise, 'movementPattern'>,
): Exercise => ({
	id,
	name: id,
	primaryMuscles: [],
	secondaryMuscles: [],
	equipment: 'barbell',
	mechanic: 'COMPOUND',
	equipmentRequired: [],
	substitutionGroup: null,
	instructions: [],
	mediaUrl: null,
	createdAt: '2026-09-13T00:00:00.000Z',
	updatedAt: '2026-09-13T00:00:00.000Z',
	...fields,
})

const catalog: Record<string, Exercise> = {
	bench: exercise('bench', {
		movementPattern: 'HORIZONTAL_PUSH',
		primaryMuscles: ['PECTORAL'],
		secondaryMuscles: ['ANTERIOR_DELTOIDS', 'TRICEPS'],
		equipmentRequired: ['barbell', 'bench', 'rack'],
	}),
	row: exercise('row', {
		movementPattern: 'HORIZONTAL_PULL',
		primaryMuscles: ['LATISSIMUS_DORSI', 'TRAPEZIUS'],
		secondaryMuscles: ['BICEPS', 'REAR_DELTOIDS'],
		equipmentRequired: ['barbell'],
	}),
	squat: exercise('squat', {
		movementPattern: 'SQUAT',
		primaryMuscles: ['QUADRICEPS', 'GLUTES'],
		secondaryMuscles: ['HAMSTRINGS', 'CORE', 'CALVES'],
		equipmentRequired: ['barbell', 'rack'],
	}),
	rdl: exercise('rdl', {
		movementPattern: 'HINGE',
		primaryMuscles: ['HAMSTRINGS', 'GLUTES'],
		secondaryMuscles: ['ERECTOR_SPINAE'],
		equipmentRequired: ['barbell'],
	}),
	pushup: exercise('pushup', {
		movementPattern: 'HORIZONTAL_PUSH',
		primaryMuscles: ['PECTORAL'],
		equipmentRequired: ['bodyweight'],
	}),
	pulldown: exercise('pulldown', {
		movementPattern: 'VERTICAL_PULL',
		primaryMuscles: ['LATISSIMUS_DORSI'],
		equipmentRequired: ['cable'],
	}),
	custom: exercise('custom', { movementPattern: null }),
}

const planned = (
	exerciseId: string,
	sets: number,
	options: Partial<RoutineWizardExercise> = {},
): RoutineWizardExercise => ({
	exerciseId,
	progressionScheme: 'NONE',
	minWeightIncrement: 2.5,
	restSeconds: 120,
	sets: Array.from({ length: sets }, (_, index) => ({
		setNumber: index + 1,
		repType: 'FIXED' as const,
		reps: 10,
	})),
	...options,
})

const routine = (...days: RoutineWizardExercise[][]): RoutineWizardData => ({
	name: 'Test',
	trainingDays: days.map((_, index) => index + 1),
	days: days.map((exercises, index) => ({ dayOfWeek: index + 1, exercises })),
})

const location = (
	equipment: string[],
	overrides: Partial<TrainingLocationPreference> = {},
): TrainingLocationPreference => ({
	id: 'home',
	name: 'Home Gym',
	isDefault: true,
	barWeightKg: 20,
	availablePlatePairs: [],
	equipment,
	createdAt: '2026-09-13T00:00:00.000Z',
	updatedAt: '2026-09-13T00:00:00.000Z',
	...overrides,
})

describe('computeWeeklyMuscleSets', () => {
	it('weights primary muscles 1.0 and secondary 0.5 across every day', () => {
		const result = computeWeeklyMuscleSets(
			routine(
				[planned('bench', 3)],
				[planned('bench', 3), planned('squat', 4)],
			),
			catalog,
		)
		const byMuscle = Object.fromEntries(result.map(m => [m.muscle, m.sets]))
		expect(byMuscle.PECTORAL).toBe(6)
		expect(byMuscle.TRICEPS).toBe(3)
		expect(byMuscle.QUADRICEPS).toBe(4)
		expect(byMuscle.HAMSTRINGS).toBe(2)
		expect(result[0].muscle).toBe('PECTORAL')
	})

	it('counts a muscle once when it is both primary and secondary', () => {
		const odd = {
			odd: exercise('odd', {
				movementPattern: 'ELBOW_FLEXION',
				primaryMuscles: ['BICEPS'],
				secondaryMuscles: ['BICEPS', 'FOREARMS'],
			}),
		}
		const result = computeWeeklyMuscleSets(routine([planned('odd', 3)]), odd)
		expect(result).toEqual([
			{ muscle: 'BICEPS', sets: 3 },
			{ muscle: 'FOREARMS', sets: 1.5 },
		])
	})
})

describe('estimateDaySeconds', () => {
	it('adds working time, rest between sets except the last, and setup', () => {
		// 2 exercises x 3 sets x 10 reps x 4 s = 240 s work, 5 rests x 120 s,
		// 2 x 60 s setup = 960 s, rounded to 15 minutes.
		const [day] = routine([planned('bench', 3), planned('row', 3)]).days
		expect(estimateDaySeconds(day)).toBe(900)
	})

	it('uses the midpoint of a rep range and a floor of five minutes', () => {
		const [day] = routine([
			planned('bench', 1, {
				restSeconds: 0,
				sets: [{ setNumber: 1, repType: 'RANGE', minReps: 8, maxReps: 12 }],
			}),
		]).days
		expect(estimateDaySeconds(day)).toBe(300)
	})

	it('returns 0 for a day with no exercises', () => {
		expect(estimateDaySeconds({ dayOfWeek: 1, exercises: [] })).toBe(0)
	})
})

describe('equipment', () => {
	it('lists what the routine needs in vocabulary order without bodyweight', () => {
		expect(
			computeRoutineEquipment(
				routine([
					planned('pulldown', 3),
					planned('pushup', 3),
					planned('bench', 3),
				]),
				catalog,
			),
		).toEqual(['barbell', 'cable', 'bench', 'rack'])
	})

	it('checks the default location and reports what is not listed', () => {
		const locations = [
			location(['barbell', 'rack'], { id: 'other', isDefault: false }),
			location(['barbells', 'bench']),
		]
		expect(
			checkEquipmentAtLocation(['barbell', 'bench', 'rack'], locations),
		).toEqual({
			status: 'missing',
			locationName: 'Home Gym',
			missing: ['rack'],
		})
		expect(checkEquipmentAtLocation(['barbell'], locations)).toEqual({
			status: 'all-listed',
			locationName: 'Home Gym',
		})
		expect(checkEquipmentAtLocation(['barbell'], [location([])])).toEqual({
			status: 'nothing-listed',
			locationName: 'Home Gym',
		})
		expect(checkEquipmentAtLocation(['barbell'], [])).toEqual({
			status: 'no-location',
		})
	})
})

describe('findLikelyImbalances', () => {
	const flags = (data: RoutineWizardData) =>
		findLikelyImbalances(data, catalog, computeWeeklyMuscleSets(data, catalog))

	it('flags a push-heavy upper-only routine with its evidence', () => {
		const result = flags(
			routine([planned('bench', 4)], [planned('bench', 4), planned('row', 3)]),
		)
		expect(result.map(f => f.kind)).toEqual(['NO_LOWER_BODY', 'PUSH_PULL'])
		expect(result[0].evidence).toBe(
			'11 upper-body sets a week and none for the legs.',
		)
		expect(result[1]).toMatchObject({
			title: 'More pressing than pulling',
			evidence: '8 pressing sets and 3 pulling sets a week.',
		})
	})

	it('flags quads outweighing hamstrings when there is no hinge', () => {
		const result = flags(routine([planned('squat', 4)], [planned('squat', 4)]))
		expect(result.map(f => f.kind)).toEqual(['NO_UPPER_BODY', 'QUAD_HAMSTRING'])
		expect(result[1].evidence).toBe(
			'Quads 8 and hamstrings 4 weekly set-equivalents.',
		)
	})

	it('stays quiet for a balanced full-body week and for small drafts', () => {
		expect(
			flags(
				routine(
					[planned('bench', 3), planned('row', 3), planned('squat', 3)],
					[planned('bench', 3), planned('pulldown', 3), planned('rdl', 3)],
				),
			),
		).toEqual([])
		expect(flags(routine([planned('bench', 3)]))).toEqual([])
	})
})

describe('buildRoutineQualitySummary', () => {
	it('counts exercises without movement data and keeps day order', () => {
		const data = routine([planned('custom', 2)], [planned('bench', 3)])
		const summary = buildRoutineQualitySummary(data, catalog, undefined)
		expect(summary.unclassifiedExercises).toBe(1)
		expect(summary.durations.map(d => d.dayOfWeek)).toEqual([1, 2])
		expect(summary.equipmentCheck).toEqual({ status: 'no-location' })
	})

	it('formats fractional set-equivalents with one decimal', () => {
		expect(formatSetCount(7.5)).toBe('7.5')
		expect(formatSetCount(12)).toBe('12')
	})
})
