import type {
	LinearPeriodizationState,
	SetKind,
	WeightUnit,
} from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import type { Translator } from '@/i18n/translator'

import {
	lpPercentage,
	lpPercentLabel,
	lpPositionLabel,
	lpSetTargetLabel,
} from './linear-periodization'
import { formatWeight } from './weight-unit'

// ROUT-17: an 8-week block on the live session and in history. The block's
// rules are contracts'; this only says where a workout stands in it.

type TBlock = Translator<'routines.linearBlock'>
type T = Translator<'workout.linearBlock'>

/**
 * Each prescribed set's 0-based place among the working sets, the LP way
 * (`lpWorkingSets`): every set that is not a warm-up, in set order. Warm-ups
 * are left out of the map.
 */
export function lpWorkingIndexes(
	sets: ReadonlyArray<{ setNumber: number; kind?: SetKind | null }>,
): Map<number, number> {
	const indexes = new Map<number, number>()
	for (const set of [...sets].sort((a, b) => a.setNumber - b.setNumber)) {
		if (set.kind === 'WARMUP') continue
		indexes.set(set.setNumber, indexes.size)
	}
	return indexes
}

/**
 * What a slot trains in this workout: its block (`state`) when it is an LP
 * slot with a reference max, or `unset` when it is an LP slot without one (a
 * clone), which is trained as a normal exercise. A swapped slot reaches here
 * with no scheme (`applySessionSubstitutions`), so it is neither.
 */
export function sessionLinearBlock(exercise: {
	progressionScheme: string
	linearPeriodization?: LinearPeriodizationState | null
}): { state: LinearPeriodizationState | null; unset: boolean } {
	if (exercise.progressionScheme !== 'LINEAR_PERIODIZATION')
		return { state: null, unset: false }
	const state = exercise.linearPeriodization ?? null
	return { state, unset: state === null }
}

/**
 * The logged sets whose load an 8-week block fixed: the working sets of a
 * slot that trained its block (not swapped, with a reference max). The
 * server refuses to correct their weight.
 */
export function lpFixedLoadLogIds(
	groups: ReadonlyArray<{
		linearPeriodization?: LinearPeriodizationState | null
		plannedSets: ReadonlyArray<{
			setNumber: number
			workingIndex?: number | null
		}>
		performedSets: ReadonlyArray<{ id: string; setNumber: number }>
	}>,
): Set<string> {
	const ids = new Set<string>()
	for (const group of groups) {
		if (!group.linearPeriodization) continue
		const working = new Set(
			group.plannedSets
				.filter(set => set.workingIndex != null)
				.map(set => set.setNumber),
		)
		for (const log of group.performedSets)
			if (working.has(log.setNumber)) ids.add(log.id)
	}
	return ids
}

/** A session on a rotation routine counts sessions, not weeks. */
export function isRotationDay(
	day: { dayOfWeek?: number | null } | null | undefined,
): boolean {
	return day?.dayOfWeek === null
}

/** "Week 3 of 8 · 69 %", "Session 3 of 8 · 69 %" or "Recovery step · 70 %". */
export function lpSessionLine(
	state: LinearPeriodizationState,
	rotation: boolean,
	locale: Locale,
	t: T,
	tBlock: TBlock,
): string {
	return t('positionLine', {
		position: lpPositionLabel(state, rotation, tBlock),
		percent: lpPercentLabel(lpPercentage(state), locale),
	})
}

/** The finished block's note: its sets repeat the final step and move nothing. */
export function lpFinishedNote(rotation: boolean, t: T): string {
	return t(rotation ? 'finishedNoteSession' : 'finishedNoteWeek')
}

/**
 * A planned set of a block as history reads it: "72.5 kg · RIR 2–3", or the
 * load alone past the step's targets.
 */
export function lpPlannedSetLabel(
	state: LinearPeriodizationState,
	workingIndex: number,
	loadKg: number | null | undefined,
	options: { unit: WeightUnit; locale: Locale },
	t: T,
	tBlock: TBlock,
): string {
	const load = formatWeight(loadKg, options.unit, options.locale)
	const target = lpSetTargetLabel(state, workingIndex, tBlock)
	return target ? t('plannedSet', { load, target }) : load
}
