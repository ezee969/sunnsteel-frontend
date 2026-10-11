import {
	type LinearPeriodizationState,
	LP_REST_SECONDS,
	lpAtStep,
	lpStep,
	type LpStoredSet,
	lpStoredSets,
	startLinearPeriodization,
} from '@sunsteel/contracts'

import type { Translator } from '@/i18n/translator'
import {
	lpSetTargetLabel,
	lpTargetLabel,
} from '@/lib/utils/linear-periodization'

import type {
	RoutineSet,
	RoutineWizardData,
	RoutineWizardExercise,
} from '../types'

// ROUT-17: the builder's side of an exercise on an 8-week block. The block
// owns its working sets (the server regenerates them from the state), so the
// builder shows exactly what will be stored: warm-ups first and editable,
// then the block's working sets, read-only.

type LpExercise = Pick<
	RoutineWizardExercise,
	'progressionScheme' | 'sets' | 'minWeightIncrement' | 'restSeconds'
> & { linearPeriodization?: LinearPeriodizationState | null }

export const isLinearExercise = (
	exercise: Pick<RoutineWizardExercise, 'progressionScheme'>,
) => exercise.progressionScheme === 'LINEAR_PERIODIZATION'

/** An LP working set: on a block, every set that is not a warm-up. */
export const isLpWorkingSet = (
	exercise: Pick<RoutineWizardExercise, 'progressionScheme'>,
	set: Pick<RoutineSet, 'kind'>,
) => isLinearExercise(exercise) && set.kind !== 'WARMUP'

const toWizardSet = (stored: LpStoredSet): RoutineSet => ({
	setNumber: 0,
	repType: 'FIXED',
	reps: stored.reps,
	minReps: null,
	maxReps: null,
	weight: stored.weight,
	rir: stored.rir,
	kind: 'WORKING',
	warmUpShare: null,
})

/**
 * The exercise's warm-ups (as they are) followed by the block's working sets
 * for its state, renumbered from 1. Mutates and returns the exercise.
 */
export function regenerateLinearSets<E extends LpExercise>(exercise: E): E {
	const warmUps = exercise.sets.filter(set => set.kind === 'WARMUP')
	const working = lpStoredSets(
		exercise.linearPeriodization ?? null,
		exercise.minWeightIncrement,
	).map(toWizardSet)
	exercise.sets = [...warmUps, ...working]
	exercise.sets.forEach((set, index) => {
		set.setNumber = index + 1
	})
	return exercise
}

/** Switching an exercise onto a block: its rest, then its sets. */
export function enterLinearPeriodization<E extends LpExercise>(exercise: E): E {
	exercise.progressionScheme = 'LINEAR_PERIODIZATION'
	exercise.restSeconds = LP_REST_SECONDS
	return regenerateLinearSets(exercise)
}

/** The rep count a former block set keeps when the exercise leaves LP. */
export const LEFT_BLOCK_REPS = 5

/**
 * Switching an exercise off a block: the state goes (the server drops it
 * too), and the working sets become plain fixed sets that keep their loads.
 */
export function leaveLinearPeriodization<E extends LpExercise>(exercise: E): E {
	exercise.linearPeriodization = null
	exercise.sets.forEach(set => {
		if (set.kind === 'WARMUP') return
		set.repType = 'FIXED'
		set.reps = set.reps ?? LEFT_BLOCK_REPS
		set.minReps = null
		set.maxReps = null
	})
	return exercise
}

/**
 * The state a reference max typed in the builder leaves: a new block when
 * there is none -- at `step` when the member already chose the week they are
 * on (ROUT-20) -- and the same place in the block with the new reference
 * during one. A finished block or its recovery step is unchanged: what
 * follows it is chosen on the routine's page (ROUT-19).
 */
export function withReferenceMax(
	state: LinearPeriodizationState | null | undefined,
	referenceMaxKg: number,
	step = 1,
): LinearPeriodizationState {
	if (!state) return startLinearPeriodization(referenceMaxKg, 1, step)
	if (state.phase !== 'BLOCK') return state
	return { ...state, referenceMaxKg }
}

/**
 * ROUT-20: where a running block stands, chosen by the member who already
 * trained part of it outside the app. Only a running block moves; the weeks
 * before it are never treated as workouts.
 */
export function withStep(
	state: LinearPeriodizationState,
	step: number,
): LinearPeriodizationState {
	if (state.phase !== 'BLOCK' || state.step === step) return state
	return lpAtStep(state, step)
}

/** A running block of the routine: where it is in the days. */
export interface LinearBlockSlot {
	dayIndex: number
	exerciseIndex: number
	exerciseId: string
	state: LinearPeriodizationState
}

/** Every exercise of the routine on a running 8-week block, in day order. */
export function runningLinearBlocks(
	data: Pick<RoutineWizardData, 'days'>,
): LinearBlockSlot[] {
	return data.days.flatMap((day, dayIndex) =>
		day.exercises.flatMap((exercise, exerciseIndex) => {
			const state = exercise.linearPeriodization
			return isLinearExercise(exercise) && state?.phase === 'BLOCK'
				? [{ dayIndex, exerciseIndex, exerciseId: exercise.exerciseId, state }]
				: []
		}),
	)
}

/** The week every running block shares, or null when they differ. */
export function sharedLinearStep(slots: LinearBlockSlot[]): number | null {
	const steps = new Set(slots.map(slot => slot.state.step))
	return steps.size === 1 ? [...steps][0] : null
}

/**
 * ROUT-20: every running block of the routine at one week, with its working
 * sets regenerated -- "I'm starting this programme at week 2" in one step.
 * Days and exercises not on a running block are returned as they were.
 */
export function withAllLinearSteps(
	days: RoutineWizardData['days'],
	step: number,
): RoutineWizardData['days'] {
	return days.map(day => {
		if (
			!day.exercises.some(
				exercise =>
					isLinearExercise(exercise) &&
					exercise.linearPeriodization?.phase === 'BLOCK',
			)
		) {
			return day
		}
		return {
			...day,
			exercises: day.exercises.map(exercise => {
				const state = exercise.linearPeriodization
				if (!isLinearExercise(exercise) || state?.phase !== 'BLOCK') {
					return exercise
				}
				return regenerateLinearSets({
					...exercise,
					sets: exercise.sets.map(set => ({ ...set })),
					linearPeriodization: withStep(state, step),
				})
			}),
		}
	})
}

/** A new block from step 1, on the same reference. */
export const restartLinearPeriodization = (state: LinearPeriodizationState) =>
	startLinearPeriodization(state.referenceMaxKg, state.cycle + 1)

/** Whether "Restart block" has anything to restart. */
export const canRestartBlock = (
	state: LinearPeriodizationState | null | undefined,
) => Boolean(state) && (state!.phase !== 'BLOCK' || state!.step > 1)

/**
 * The target of the working set at `index` (0-based among working sets): the
 * state's, or a new block's first step while no reference is set.
 */
export function lpWorkingSetTarget(
	state: LinearPeriodizationState | null | undefined,
	index: number,
	t: Translator<'routines.linearBlock'>,
): string | null {
	if (state) return lpSetTargetLabel(state, index, t)
	const target = lpStep(1).sets[index]
	return target ? lpTargetLabel(target, t) : null
}
