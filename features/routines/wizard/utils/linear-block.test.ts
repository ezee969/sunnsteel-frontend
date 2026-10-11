import { LP_REST_SECONDS, startLinearPeriodization } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import type { RoutineWizardData, RoutineWizardExercise } from '../types'
import { usesAdvancedOptions } from './advanced-options'
import {
	canRestartBlock,
	enterLinearPeriodization,
	isLpWorkingSet,
	leaveLinearPeriodization,
	lpWorkingSetTarget,
	regenerateLinearSets,
	restartLinearPeriodization,
	runningLinearBlocks,
	sharedLinearStep,
	withAllLinearSteps,
	withReferenceMax,
	withStep,
} from './linear-block'
import { estimateDaySeconds } from './routine-quality'
import { buildRoutineRequest } from './routine-summary'
import { isWeightLocked } from './set-kinds'

const en = translatorFor('en', 'routines.linearBlock')
const es = translatorFor('es', 'routines.linearBlock')

const squat = (): RoutineWizardExercise => ({
	exerciseId: 'squat',
	progressionScheme: 'DOUBLE_PROGRESSION',
	minWeightIncrement: 2.5,
	restSeconds: 120,
	sets: [
		{ setNumber: 1, repType: 'FIXED', reps: 8, weight: 40, kind: 'WARMUP' },
		{ setNumber: 2, repType: 'RANGE', minReps: 6, maxReps: 8, weight: 90 },
		{ setNumber: 3, repType: 'RANGE', minReps: 6, maxReps: 8, weight: 90 },
		{ setNumber: 4, repType: 'RANGE', minReps: 6, maxReps: 8, weight: 60 },
	],
})

describe('an exercise entering an 8-week block (ROUT-17)', () => {
	it('keeps its warm-ups first and takes the block rest and three locked working sets', () => {
		const exercise = enterLinearPeriodization(squat())
		expect(exercise.progressionScheme).toBe('LINEAR_PERIODIZATION')
		expect(exercise.restSeconds).toBe(LP_REST_SECONDS)
		expect(exercise.sets.map(set => [set.setNumber, set.kind])).toEqual([
			[1, 'WARMUP'],
			[2, 'WORKING'],
			[3, 'WORKING'],
			[4, 'WORKING'],
		])
		// No reference yet: no loads and no rep target.
		expect(exercise.sets.slice(1).map(set => [set.reps, set.weight])).toEqual([
			[null, null],
			[null, null],
			[null, null],
		])
		expect(exercise.sets[0].weight).toBe(40)
	})

	it('loads the step from the reference, on the exercise step', () => {
		const exercise = enterLinearPeriodization(squat())
		exercise.linearPeriodization = startLinearPeriodization(100)
		regenerateLinearSets(exercise)
		expect(exercise.sets.slice(1).map(set => [set.weight, set.rir])).toEqual([
			[62.5, 2],
			[62.5, 2],
			[62.5, 0],
		])
		exercise.minWeightIncrement = 5
		regenerateLinearSets(exercise)
		expect(exercise.sets[1].weight).toBe(65)
	})

	it('leaves the block as plain fixed sets that keep their loads', () => {
		const exercise = enterLinearPeriodization(squat())
		exercise.linearPeriodization = startLinearPeriodization(100)
		regenerateLinearSets(exercise)
		leaveLinearPeriodization(exercise)
		expect(exercise.linearPeriodization).toBeNull()
		expect(
			exercise.sets.map(set => [set.kind, set.repType, set.reps, set.weight]),
		).toEqual([
			['WARMUP', 'FIXED', 8, 40],
			['WORKING', 'FIXED', 5, 62.5],
			['WORKING', 'FIXED', 5, 62.5],
			['WORKING', 'FIXED', 5, 62.5],
		])
	})
})

describe('the reference max and a restart', () => {
	it('starts a block, then keeps its place when the reference changes', () => {
		const started = withReferenceMax(null, 100)
		expect(started).toMatchObject({ phase: 'BLOCK', step: 1, cycle: 1 })
		const moved = withReferenceMax({ ...started, step: 4 }, 110)
		expect(moved).toMatchObject({ referenceMaxKg: 110, step: 4, cycle: 1 })
		const finished = { ...started, phase: 'FINISHED' as const, step: 8 }
		expect(withReferenceMax(finished, 120)).toBe(finished)
	})

	it('restarts from step 1 of the next cycle, only when there is something to restart', () => {
		const started = startLinearPeriodization(100)
		expect(canRestartBlock(null)).toBe(false)
		expect(canRestartBlock(started)).toBe(false)
		expect(canRestartBlock({ ...started, step: 2 })).toBe(true)
		expect(canRestartBlock({ ...started, phase: 'FINISHED', step: 8 })).toBe(
			true,
		)
		expect(restartLinearPeriodization({ ...started, step: 5 })).toMatchObject({
			referenceMaxKg: 100,
			step: 1,
			cycle: 2,
			samples: [],
		})
	})

	it("names each working set's target, a new block's while none is set", () => {
		expect([0, 1, 2].map(i => lpWorkingSetTarget(null, i, en))).toEqual([
			'RIR 2–3',
			'RIR 2–3',
			'AMRAP · RIR 0',
		])
		const late = { ...startLinearPeriodization(100), step: 6 }
		expect(lpWorkingSetTarget(late, 2, es)).toBe('RIR 1–2')
		expect(lpWorkingSetTarget(late, 3, en)).toBeNull()
	})
})

describe('the rest of the builder around a block', () => {
	const lpExercise = () => {
		const exercise = enterLinearPeriodization(squat())
		exercise.linearPeriodization = startLinearPeriodization(100)
		return regenerateLinearSets(exercise)
	}

	it('locks the working loads and leaves the warm-ups free', () => {
		const { sets, progressionScheme } = lpExercise()
		expect(
			sets.map((_, index) => isWeightLocked(sets, index, progressionScheme)),
		).toEqual([false, true, true, true])
		expect(isLpWorkingSet({ progressionScheme }, sets[0])).toBe(false)
		expect(isLpWorkingSet({ progressionScheme }, sets[1])).toBe(true)
	})

	it('keeps its options open', () => {
		const exercise = enterLinearPeriodization({ ...squat(), sets: [] })
		expect(usesAdvancedOptions({ ...exercise, sets: [] })).toBe(true)
	})

	it('sends its state and its working sets without a rep target', () => {
		const exercise = lpExercise()
		const data = {
			name: 'Legs',
			scheduleMode: 'WEEKLY',
			trainingDays: [1],
			restDays: [],
			rotationWeekdays: [],
			days: [{ slot: 1, name: '', exercises: [exercise, squat()] }],
		} as RoutineWizardData
		const [sent, other] = buildRoutineRequest(data).days[0].exercises
		expect(sent.linearPeriodization).toEqual(exercise.linearPeriodization)
		expect(sent.sets[1]).toMatchObject({
			repType: 'FIXED',
			reps: null,
			weight: 62.5,
			kind: 'WORKING',
		})
		expect(sent.sets[0]).toMatchObject({ reps: 8, kind: 'WARMUP' })
		expect(other.linearPeriodization).toBeNull()
	})

	it('counts no work time for a set without a rep target', () => {
		const exercise = lpExercise()
		const seconds = estimateDaySeconds({ slot: 1, exercises: [exercise] })
		expect(Number.isNaN(seconds)).toBe(false)
		// 60 s setup, 8 reps × 4 s for the warm-up, 3 × 180 s rest: 632 s.
		expect(seconds).toBe(600)
	})
})

describe('a block started part of the way through (ROUT-20)', () => {
	const atWeek = (step: number, referenceMaxKg = 100) => {
		const exercise = enterLinearPeriodization(squat())
		exercise.linearPeriodization = withReferenceMax(null, referenceMaxKg, step)
		return regenerateLinearSets(exercise)
	}
	const routine = (
		...days: RoutineWizardExercise[][]
	): Pick<RoutineWizardData, 'days'> => ({
		days: days.map((exercises, index) => ({ slot: index + 1, exercises })),
	})

	it('starts a new block at the week chosen before the reference', () => {
		const exercise = atWeek(3)
		expect(exercise.linearPeriodization).toMatchObject({
			phase: 'BLOCK',
			step: 3,
			cycle: 1,
			samples: [],
		})
		// Week 3 is 69 % of 100 kg, on the 2.5 kg step.
		expect(exercise.sets.slice(1).map(set => set.weight)).toEqual([70, 70, 70])
		expect(exercise.sets[0]).toMatchObject({ kind: 'WARMUP', weight: 40 })
	})

	it('moves a running block to another week and leaves a finished one alone', () => {
		const running = startLinearPeriodization(100)
		expect(withStep(running, 5)).toMatchObject({ step: 5, referenceMaxKg: 100 })
		expect(withStep(running, 1)).toBe(running)
		const finished = { ...running, phase: 'FINISHED' as const, step: 8 }
		expect(withStep(finished, 2)).toBe(finished)
	})

	it('keeps the week when the reference changes during the block', () => {
		const state = withReferenceMax(startLinearPeriodization(100, 1, 4), 120)
		expect(state).toMatchObject({ step: 4, referenceMaxKg: 120 })
	})

	it('lists the running blocks in day order and says when they share a week', () => {
		const data = routine([atWeek(2), squat()], [atWeek(2, 80)])
		const slots = runningLinearBlocks(data)
		expect(slots.map(slot => [slot.dayIndex, slot.exerciseIndex])).toEqual([
			[0, 0],
			[1, 0],
		])
		expect(sharedLinearStep(slots)).toBe(2)
		const mixed = routine([atWeek(2)], [atWeek(4)])
		expect(sharedLinearStep(runningLinearBlocks(mixed))).toBeNull()
	})

	it('sets every running block to one week without touching anything else', () => {
		const other = squat()
		const data = routine([atWeek(1), other], [atWeek(3, 80)])
		const days = withAllLinearSteps(data.days, 2)
		expect(
			days.map(day =>
				day.exercises.map(exercise => exercise.linearPeriodization?.step),
			),
		).toEqual([[2, undefined], [2]])
		// Week 2 is 66 %: 66 kg → 65, 52.8 kg → 52.5 on the 2.5 kg step.
		expect(days[0].exercises[0].sets[1].weight).toBe(65)
		expect(days[1].exercises[0].sets[1].weight).toBe(52.5)
		expect(days[0].exercises[1]).toBe(other)
		// The days it was given are left as they were.
		expect(data.days[0].exercises[0].linearPeriodization?.step).toBe(1)
		expect(data.days[0].exercises[0].sets[1].weight).toBe(62.5)
	})

	it('names the week control and its hint in both languages', () => {
		expect(en('currentWeek')).toBe('Current week')
		expect(en('currentSession')).toBe('Current session')
		expect(es('currentWeek')).toBe('Semana actual')
		for (const t of [en, es]) {
			expect(t('positionHint').length).toBeLessThanOrEqual(110)
			expect(
				t('reviewRow', { day: 'A', exercise: 'B', position: 'C' }),
			).toContain('C')
		}
	})
})
