import {
	LOGGED_WORKOUT_LOOKBACK_DAYS,
	type Routine,
	type RoutineDay,
	type RoutineExercise,
	startLinearPeriodization,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	buildLoggedWorkoutRequest,
	defaultLoggedStep,
	loggableDateRange,
	loggableDays,
	loggedDraftForDay,
	withLoggedStep,
} from './logged-workouts'

const en = translatorFor('en', 'routines.logPast')
const es = translatorFor('es', 'routines.logPast')

const exercise = (
	id: string,
	values: Partial<RoutineExercise> = {},
): RoutineExercise =>
	({
		id,
		order: 0,
		restSeconds: 90,
		progressionScheme: 'DOUBLE_PROGRESSION',
		minWeightIncrement: 2.5,
		exercise: { id: `${id}-ex`, name: id },
		sets: [
			{
				id: `${id}-1`,
				setNumber: 1,
				repType: 'FIXED',
				reps: 8,
				weight: 40,
				kind: 'WARMUP',
			},
			{
				id: `${id}-2`,
				setNumber: 2,
				repType: 'RANGE',
				minReps: 6,
				maxReps: 8,
				weight: 100,
			},
			{
				id: `${id}-3`,
				setNumber: 3,
				repType: 'RANGE',
				minReps: 6,
				maxReps: 8,
				weight: 100,
			},
		],
		...values,
	}) as RoutineExercise

const block = { ...startLinearPeriodization(100), step: 3 }
const squat = exercise('squat', {
	progressionScheme: 'LINEAR_PERIODIZATION',
	linearPeriodization: block,
	sets: [
		{
			setNumber: 1,
			repType: 'FIXED',
			reps: 5,
			weight: 40,
			kind: 'WARMUP',
		},
		...[2, 3, 4].map(setNumber => ({
			setNumber,
			repType: 'FIXED' as const,
			reps: null,
			weight: 70,
		})),
	],
})
const day = {
	id: 'day-a',
	order: 0,
	dayOfWeek: 1,
	exercises: [exercise('bench'), squat],
} as RoutineDay
const range = { first: '2026-07-19', last: '2026-10-08' }

describe('the dates and days a past workout can take (LIVE-23)', () => {
	it('runs from the lookback to the day before the routine was created', () => {
		const now = new Date(2026, 9, 11, 10)
		expect(
			loggableDateRange(
				{ createdAt: new Date(2026, 9, 9, 18).toISOString() },
				now,
			),
		).toEqual(range)
		expect(LOGGED_WORKOUT_LOOKBACK_DAYS).toBe(84)
		// Created at the edge of the lookback: nothing to log on.
		expect(
			loggableDateRange(
				{ createdAt: new Date(2026, 6, 19, 9).toISOString() },
				now,
			),
		).toBeNull()
	})

	it('offers only days with exercises', () => {
		const empty = { ...day, id: 'empty', exercises: [] }
		expect(
			loggableDays({ days: [day, empty] } as unknown as Routine).map(d => d.id),
		).toEqual(['day-a'])
	})
})

describe('the form for one day', () => {
	const draft = () =>
		loggedDraftForDay(day, '2026-10-05', 'KG', e => e.exercise.name)

	it('fills the plan, an 8-week slot at the week before its own', () => {
		expect(defaultLoggedStep(block)).toBe(2)
		const form = draft()
		const [bench, lp] = form.exercises
		expect(bench.step).toBeNull()
		expect(bench.sets.map(set => [set.reps, set.weight, set.isWarmUp])).toEqual(
			[
				['8', '40', true],
				['8', '100', false],
				['8', '100', false],
			],
		)
		expect(lp.step).toBe(2)
		// Week 2 is 66 % of 100 kg on the 2.5 kg step; the warm-up keeps its own.
		expect(lp.sets.map(set => set.weight)).toEqual(['40', '65', '65', '65'])
		expect(lp.sets.every(set => set.isCompleted)).toBe(true)
		expect(form.startTime).toBe('12:00')
	})

	it('moves an 8-week slot to another week, keeping the reps typed', () => {
		const lp = { ...draft().exercises[1] }
		lp.sets = lp.sets.map(set => ({ ...set, reps: '7' }))
		const moved = withLoggedStep(lp, squat, 1, 'KG')
		expect(moved.step).toBe(1)
		expect(moved.sets.map(set => [set.weight, set.reps])).toEqual([
			['40', '7'],
			['62.5', '7'],
			['62.5', '7'],
			['62.5', '7'],
		])
	})
})

describe('the request a form makes', () => {
	const form = () =>
		loggedDraftForDay(day, '2026-10-05', 'KG', e => e.exercise.name)

	it('sends every done set, the start minute, the length and the weeks', () => {
		const draft = form()
		draft.startTime = '18:30'
		draft.duration = '75'
		draft.exercises[1].sets.forEach(set => {
			set.reps = '6'
		})
		const { request, problems } = buildLoggedWorkoutRequest(
			'routine-1',
			draft,
			range,
			'KG',
			en,
		)
		expect(problems).toEqual([])
		expect(request).toMatchObject({
			routineId: 'routine-1',
			routineDayId: 'day-a',
			date: '2026-10-05',
			startMinute: 18 * 60 + 30,
			durationSec: 75 * 60,
			lpSteps: [{ routineExerciseId: 'squat', step: 2 }],
		})
		expect(request!.sets).toHaveLength(7)
		expect(request!.sets[4]).toEqual({
			routineExerciseId: 'squat',
			setNumber: 2,
			reps: 6,
			weight: 65,
			isCompleted: true,
		})
	})

	it('leaves an empty set out and sends an untouched pound weight exactly', () => {
		const draft = loggedDraftForDay(
			day,
			'2026-10-05',
			'LB',
			e => e.exercise.name,
		)
		draft.exercises[1].sets.forEach(set => {
			set.reps = '6'
		})
		const bench = draft.exercises[0]
		bench.sets[0] = {
			...bench.sets[0],
			reps: '',
			weight: '',
			isCompleted: false,
		}
		const { request } = buildLoggedWorkoutRequest('r', draft, range, 'LB', en)
		expect(
			request!.sets.some(
				set => set.routineExerciseId === 'bench' && set.setNumber === 1,
			),
		).toBe(false)
		// 100 kg reads 220.46 lb in the box; untouched, it goes back as 100.
		expect(
			request!.sets.find(set => set.routineExerciseId === 'bench')!.weight,
		).toBe(100)
		expect(
			request!.sets.find(
				set => set.setNumber === 2 && set.routineExerciseId === 'squat',
			)!.weight,
		).toBe(65)
	})

	it('names every problem, in both languages', () => {
		const draft = form()
		draft.date = '2026-10-09'
		draft.startTime = '25:00'
		draft.duration = '0'
		const lp = draft.exercises[1]
		lp.sets[1] = { ...lp.sets[1], reps: '' }
		lp.sets[2] = { ...lp.sets[2], reps: '0' }
		lp.sets[3] = { ...lp.sets[3], reps: '5', weight: 'x' }
		const { request, problems } = buildLoggedWorkoutRequest(
			'r',
			draft,
			range,
			'KG',
			en,
		)
		expect(request).toBeNull()
		expect(problems).toEqual([
			'Choose a date between 2026-07-19 and 2026-10-08.',
			'Enter a start time.',
			'Enter a length between 1 and 360 minutes.',
			'Set 2 of squat: reps must be a whole number.',
			'Set 3 of squat: a done set needs at least one rep.',
			'Set 4 of squat: enter a weight (0 for bodyweight).',
		])
		const spanish = buildLoggedWorkoutRequest('r', draft, range, 'KG', es)
		expect(spanish.problems[0]).toBe(
			'Elige una fecha entre el 2026-07-19 y el 2026-10-08.',
		)
	})

	it('needs a done set', () => {
		const draft = form()
		for (const e of draft.exercises)
			e.sets = e.sets.map(set => ({ ...set, isCompleted: false }))
		const { problems } = buildLoggedWorkoutRequest('r', draft, range, 'KG', en)
		expect(problems).toContain('Mark at least one set as done.')
	})

	it('says what logging does and does not do, without a cause', () => {
		for (const t of [en, es]) {
			expect(t('consequences').length).toBeGreaterThan(0)
			expect(t('entryBody').length).toBeLessThanOrEqual(110)
		}
		expect(en('consequences')).toMatch(/never shared or announced/)
		expect(en('consequences')).toMatch(/does not change this routine/)
	})
})
