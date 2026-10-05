import type { LinearPeriodizationState } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'
import type { RoutineExercise } from '@/lib/api/types/routine.type'
import type { WorkoutSession } from '@/lib/api/types/workout.type'

import { buildExerciseGroups } from './exercise-groups'
import {
	isRotationDay,
	lpFinishedNote,
	lpFixedLoadLogIds,
	lpPlannedSetLabel,
	lpSessionLine,
	lpWorkingIndexes,
	sessionLinearBlock,
} from './session-linear-block'
import { groupSetLogsByExercise } from './session-progress.utils'
import { applySessionSubstitutions } from './session-substitutions'

const en = translatorFor('en', 'workout.linearBlock')
const es = translatorFor('es', 'workout.linearBlock')
const enBlock = translatorFor('en', 'routines.linearBlock')
const esBlock = translatorFor('es', 'routines.linearBlock')

const block = (
	overrides: Partial<LinearPeriodizationState> = {},
): LinearPeriodizationState => ({
	referenceMaxKg: 100,
	phase: 'BLOCK',
	step: 3,
	cycle: 1,
	samples: [],
	...overrides,
})

const bench = {
	id: 'slot-bench',
	order: 0,
	restSeconds: 180,
	progressionScheme: 'LINEAR_PERIODIZATION',
	minWeightIncrement: 2.5,
	linearPeriodization: block(),
	exercise: { id: 'bench', name: 'Bench Press', primaryMuscles: ['PECTORAL'] },
	sets: [
		{ setNumber: 1, repType: 'FIXED', reps: 8, weight: 40, kind: 'WARMUP' },
		{ setNumber: 2, repType: 'FIXED', reps: null, weight: 70, rir: 2 },
		{ setNumber: 3, repType: 'FIXED', reps: null, weight: 70, rir: 2 },
		{ setNumber: 4, repType: 'FIXED', reps: null, weight: 70, rir: 0 },
	],
} as unknown as RoutineExercise

describe('an 8-week block on the live session (ROUT-17)', () => {
	it('places each set among the working sets, warm-ups left out', () => {
		expect([...lpWorkingIndexes(bench.sets)]).toEqual([
			[2, 0],
			[3, 1],
			[4, 2],
		])
	})

	it('trains the block only on an LP slot with a reference', () => {
		expect(sessionLinearBlock(bench)).toEqual({ state: block(), unset: false })
		expect(sessionLinearBlock({ ...bench, linearPeriodization: null })).toEqual(
			{ state: null, unset: true },
		)
		expect(
			sessionLinearBlock({ ...bench, progressionScheme: 'DOUBLE_PROGRESSION' }),
		).toEqual({ state: null, unset: false })
	})

	it('keeps the block and each set’s working place through the grouping', () => {
		const [group] = groupSetLogsByExercise([], [bench], 'session-1')
		expect(group.linearPeriodization).toEqual(block())
		expect(group.linearBlockUnset).toBe(false)
		expect(group.sets.map(set => [set.setNumber, set.workingIndex])).toEqual([
			[1, null],
			[2, 0],
			[3, 1],
			[4, 2],
		])
		expect(group.sets[1].plannedWeight).toBe(70)
	})

	it('leaves the block for a swapped slot, which is then neither block nor unset', () => {
		const swapped = applySessionSubstitutions(
			[bench],
			[
				{
					routineExerciseId: 'slot-bench',
					exercise: {
						id: 'db-bench',
						name: 'Dumbbell Bench Press',
						primaryMuscles: ['PECTORAL'],
					},
				} as never,
			],
		)
		const [group] = groupSetLogsByExercise([], swapped, 'session-1')
		expect(group.linearPeriodization).toBeNull()
		expect(group.linearBlockUnset).toBe(false)
		expect(group.sets[1].plannedWeight).toBeUndefined()
	})

	it('says where the workout stands, by week or by session', () => {
		expect(lpSessionLine(block(), false, 'en', en, enBlock)).toBe(
			'Week 3 of 8 · 69%',
		)
		expect(lpSessionLine(block(), true, 'en', en, enBlock)).toBe(
			'Session 3 of 8 · 69%',
		)
		expect(
			lpSessionLine(block({ phase: 'RECOVERY' }), false, 'en', en, enBlock),
		).toBe('Recovery step · 70%')
		expect(lpSessionLine(block(), false, 'es', es, esBlock)).toBe(
			'Semana 3 de 8 · 69\u00a0%',
		)
		expect(
			lpSessionLine(block({ phase: 'RECOVERY' }), true, 'es', es, esBlock),
		).toBe('Sesión de recuperación · 70\u00a0%')
	})

	it('explains a finished block’s sets in both languages', () => {
		expect(lpFinishedNote(false, en)).toBe(
			'Block finished — these sets repeat week 8 and move nothing. Choose what follows on the routine page.',
		)
		expect(lpFinishedNote(true, es)).toBe(
			'Bloque terminado: estas series repiten la sesión 8 y no mueven nada. Elige qué sigue en la página de la rutina.',
		)
	})

	it('reads a rotation day by its missing weekday', () => {
		expect(isRotationDay({ dayOfWeek: null })).toBe(true)
		expect(isRotationDay({ dayOfWeek: 2 })).toBe(false)
		expect(isRotationDay({})).toBe(false)
		expect(isRotationDay(undefined)).toBe(false)
	})
})

describe('an 8-week block in history (ROUT-17)', () => {
	const session = {
		id: 'session-1',
		routineDay: { id: 'day', exercises: [bench] },
		setLogs: [
			{ id: 'w', routineExerciseId: 'slot-bench', setNumber: 1 },
			{ id: 'a', routineExerciseId: 'slot-bench', setNumber: 2 },
			{ id: 'b', routineExerciseId: 'slot-bench', setNumber: 4 },
		],
		exerciseSubstitutions: [],
	} as unknown as WorkoutSession

	it('reads a planned set as its load and target', () => {
		expect(
			lpPlannedSetLabel(
				block(),
				0,
				70,
				{ unit: 'KG', locale: 'en' },
				en,
				enBlock,
			),
		).toBe('70 kg · RIR 2–3')
		expect(
			lpPlannedSetLabel(
				block(),
				2,
				70,
				{ unit: 'KG', locale: 'en' },
				en,
				enBlock,
			),
		).toBe('70 kg · AMRAP · RIR 0')
		expect(
			lpPlannedSetLabel(
				block({ phase: 'RECOVERY' }),
				1,
				72.5,
				{ unit: 'KG', locale: 'es' },
				es,
				esBlock,
			),
		).toBe('72,5 kg · 5 repeticiones')
		expect(
			lpPlannedSetLabel(
				block({ phase: 'RECOVERY' }),
				2,
				72.5,
				{ unit: 'KG', locale: 'en' },
				en,
				enBlock,
			),
		).toBe('72.5 kg')
	})

	it('carries the block and working places into the history groups', () => {
		const [group] = buildExerciseGroups(session)
		expect(group.linearPeriodization).toEqual(block())
		expect(group.plannedSets.map(set => set.workingIndex)).toEqual([
			null,
			0,
			1,
			2,
		])
	})

	it('fixes the load of logged working sets only, and none once swapped', () => {
		expect([...lpFixedLoadLogIds(buildExerciseGroups(session))]).toEqual([
			'a',
			'b',
		])
		const swapped = {
			...session,
			exerciseSubstitutions: [
				{
					routineExerciseId: 'slot-bench',
					exercise: { id: 'db', name: 'Dumbbell Bench Press' },
				},
			],
		} as unknown as WorkoutSession
		expect(buildExerciseGroups(swapped)[0].linearPeriodization).toBeNull()
		expect(lpFixedLoadLogIds(buildExerciseGroups(swapped)).size).toBe(0)
	})
})
