import {
	addCalendarDays,
	type LinearPeriodizationState,
	LOGGED_WORKOUT_MAX_DURATION_SEC,
	loggedWorkoutDateRange,
	type LogPastWorkoutRequest,
	lpAtStep,
	lpStoredSets,
	type Routine,
	type RoutineDay,
	type RoutineExercise,
	type WeightUnit,
} from '@sunsteel/contracts'

import type { Translator } from '@/i18n/translator'

import { localDateKey } from './schedule-week'
import {
	areCanonicalWeightsEqual,
	formatWeightInput,
	parseWeightInput,
} from './weight-unit'

// LIVE-23: a workout done before the routine existed, logged after it
// happened. The server decides everything that follows from it; this only
// builds the form and the request.

type T = Translator<'routines.logPast'>

/**
 * The dates a past workout of this routine can be logged on, in the device's
 * calendar: from the lookback to the day before the routine was created.
 * Null when there is none, and the page then offers nothing.
 */
export function loggableDateRange(
	routine: Pick<Routine, 'createdAt'>,
	now: Date = new Date(),
): { first: string; last: string } | null {
	return loggedWorkoutDateRange({
		today: localDateKey(now),
		createdOn: localDateKey(new Date(routine.createdAt)),
	})
}

const weekdayOf = (date: string) => {
	const [year, month, day] = date.split('-').map(Number)
	return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

/**
 * The date a day's form opens on: the latest date in the range on that day's
 * weekday, else the range's last date (a rotation day, or a range too short
 * to hold the weekday).
 */
export function defaultLoggedDate(
	day: Pick<RoutineDay, 'dayOfWeek'>,
	range: { first: string; last: string },
): string {
	if (day.dayOfWeek == null) return range.last
	const back = (weekdayOf(range.last) - day.dayOfWeek + 7) % 7
	const date = addCalendarDays(range.last, -back)
	return date >= range.first ? date : range.last
}

/** The routine's own days a workout can be logged on: those with exercises. */
export const loggableDays = (routine: Pick<Routine, 'days'>): RoutineDay[] =>
	routine.days.filter(day => day.exercises.length > 0)

const isLinear = (exercise: RoutineExercise) =>
	exercise.progressionScheme === 'LINEAR_PERIODIZATION' &&
	Boolean(exercise.linearPeriodization)

/** The week an 8-week slot was on before the one it is on now. */
export const defaultLoggedStep = (state: LinearPeriodizationState): number =>
	Math.max(1, state.step - 1)

/** One set as typed, in the member's unit. */
export interface LoggedDraftSet {
	setNumber: number
	isWarmUp: boolean
	reps: string
	weight: string
	isCompleted: boolean
	/** The load the plan prescribed, kg: sent back exactly when untouched. */
	plannedKg: number | null
}

export interface LoggedDraftExercise {
	routineExerciseId: string
	exerciseName: string
	/** The 8-week block's week this workout was on; null off a block. */
	step: number | null
	sets: LoggedDraftSet[]
}

export interface LoggedWorkoutDraft {
	dayId: string
	date: string
	/** HH:MM, local. */
	startTime: string
	/** Minutes, as typed; empty uses the routine's estimate. */
	duration: string
	exercises: LoggedDraftExercise[]
}

/** The loads a slot's working sets had at a week of its block, kg. */
function blockLoads(exercise: RoutineExercise, step: number): number[] {
	const state = exercise.linearPeriodization!
	return lpStoredSets(lpAtStep(state, step), exercise.minWeightIncrement).map(
		set => set.weight ?? 0,
	)
}

function draftSets(
	exercise: RoutineExercise,
	step: number | null,
	unit: WeightUnit,
): LoggedDraftSet[] {
	const loads = step === null ? null : blockLoads(exercise, step)
	let working = 0
	return exercise.sets.map(set => {
		const isWarmUp = set.kind === 'WARMUP'
		let plannedKg = set.weight ?? null
		if (loads && !isWarmUp) {
			plannedKg = loads[working] ?? plannedKg
			working += 1
		}
		const reps = set.reps ?? set.maxReps ?? set.minReps ?? null
		return {
			setNumber: set.setNumber,
			isWarmUp,
			reps: reps == null ? '' : String(reps),
			weight: formatWeightInput(plannedKg, unit),
			isCompleted: true,
			plannedKg,
		}
	})
}

/**
 * The form for one day, filled with what the plan prescribes -- the 8-week
 * slots at the week before their own -- for the member to change into what
 * they lifted. Every set starts done.
 */
export function loggedDraftForDay(
	day: RoutineDay,
	date: string,
	unit: WeightUnit,
	names: (exercise: RoutineExercise) => string,
): LoggedWorkoutDraft {
	return {
		dayId: day.id,
		date,
		startTime: '12:00',
		duration: '',
		exercises: day.exercises.map(exercise => {
			const step = isLinear(exercise)
				? defaultLoggedStep(exercise.linearPeriodization!)
				: null
			return {
				routineExerciseId: exercise.id,
				exerciseName: names(exercise),
				step,
				sets: draftSets(exercise, step, unit),
			}
		}),
	}
}

/**
 * The same exercise at another week of its block: its working sets take
 * that week's load, warm-ups and reps stay as typed.
 */
export function withLoggedStep(
	draft: LoggedDraftExercise,
	exercise: RoutineExercise,
	step: number,
	unit: WeightUnit,
): LoggedDraftExercise {
	const next = draftSets(exercise, step, unit)
	return {
		...draft,
		step,
		sets: draft.sets.map((set, index) =>
			set.isWarmUp
				? set
				: {
						...set,
						weight: next[index]?.weight ?? set.weight,
						plannedKg: next[index]?.plannedKg ?? set.plannedKg,
					},
		),
	}
}

const TIME = /^(\d{1,2}):(\d{2})$/

/**
 * The request the draft makes, or the problems that stop it, each worded for
 * the member. A set left empty and not done is left out; a weight the member
 * did not change is sent exactly as planned, so a pound value rounded for the
 * box does not come back as a different load.
 */
export function buildLoggedWorkoutRequest(
	routineId: string,
	draft: LoggedWorkoutDraft,
	range: { first: string; last: string },
	unit: WeightUnit,
	t: T,
	/** The range as the page words it; the calendar dates by default. */
	rangeLabel: { first: string; last: string } = range,
): { request: LogPastWorkoutRequest | null; problems: string[] } {
	const problems: string[] = []
	if (!draft.date || draft.date < range.first || draft.date > range.last) {
		problems.push(t('problemDate', rangeLabel))
	}
	const time = TIME.exec(draft.startTime)
	const hours = time ? Number(time[1]) : NaN
	const minutes = time ? Number(time[2]) : NaN
	if (!time || hours > 23 || minutes > 59) problems.push(t('problemTime'))
	let durationSec: number | undefined
	if (draft.duration.trim() !== '') {
		const value = Number(draft.duration)
		const max = LOGGED_WORKOUT_MAX_DURATION_SEC / 60
		if (!Number.isInteger(value) || value < 1 || value > max) {
			problems.push(t('problemDuration', { max }))
		} else {
			durationSec = value * 60
		}
	}
	const sets: LogPastWorkoutRequest['sets'] = []
	for (const exercise of draft.exercises) {
		for (const set of exercise.sets) {
			const where = { number: set.setNumber, exercise: exercise.exerciseName }
			const repsText = set.reps.trim()
			const weightText = set.weight.trim()
			if (!set.isCompleted && repsText === '' && weightText === '') continue
			const reps = repsText === '' ? NaN : Number(repsText)
			if (!Number.isInteger(reps) || reps < 0) {
				problems.push(t('problemReps', where))
				continue
			}
			const parsed =
				weightText === '' ? undefined : parseWeightInput(weightText, unit)
			if (parsed === undefined || parsed < 0) {
				problems.push(t('problemWeight', where))
				continue
			}
			if (set.isCompleted && reps < 1) {
				problems.push(t('problemDoneNeedsReps', where))
				continue
			}
			const weight =
				set.plannedKg !== null &&
				areCanonicalWeightsEqual(parsed, set.plannedKg)
					? set.plannedKg
					: parsed
			sets.push({
				routineExerciseId: exercise.routineExerciseId,
				setNumber: set.setNumber,
				reps,
				weight,
				isCompleted: set.isCompleted,
			})
		}
	}
	if (!sets.some(set => set.isCompleted)) problems.push(t('problemNoSets'))
	if (problems.length > 0) return { request: null, problems }
	return {
		request: {
			routineId,
			routineDayId: draft.dayId,
			date: draft.date,
			startMinute: hours * 60 + minutes,
			...(durationSec !== undefined ? { durationSec } : {}),
			lpSteps: draft.exercises
				.filter(exercise => exercise.step !== null)
				.map(exercise => ({
					routineExerciseId: exercise.routineExerciseId,
					step: exercise.step!,
				})),
			sets,
		},
		problems: [],
	}
}
