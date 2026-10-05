import {
	type LinearPeriodizationState,
	LP_BLOCK_STEPS,
	LP_RECOVERY,
	lpPrescription,
	type LpSetTarget,
	lpStep,
	type WeightUnit,
} from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import { numberFormatter } from '@/i18n/date-locale'
import type { Translator } from '@/i18n/translator'

import { formatWeight } from './weight-unit'

// ROUT-17: the words every screen uses for an exercise on an 8-week block.
// The rules (table, loads, estimate) are contracts'; this only says them.

type T = Translator<'routines.linearBlock'>

/**
 * Where the slot stands: "Week 3 of 8" on a weekly routine, "Session 3 of 8"
 * on a rotation (a rotation's slot can recur more than once a week), then
 * the recovery step or the finished block.
 */
export function lpPositionLabel(
	state: Pick<LinearPeriodizationState, 'phase' | 'step'>,
	rotation: boolean,
	t: T,
): string {
	if (state.phase === 'RECOVERY') return t('recovery')
	if (state.phase === 'FINISHED') return t('finished')
	return t(rotation ? 'session' : 'week', {
		step: state.step,
		total: LP_BLOCK_STEPS,
	})
}

/** "63 %" in the member's language. */
export function lpPercentLabel(percentage: number, locale: Locale): string {
	return numberFormatter(locale, {
		style: 'percent',
		maximumFractionDigits: 0,
	}).format(percentage)
}

/** The share of the reference the slot's next workout loads. */
export function lpPercentage(state: LinearPeriodizationState): number {
	if (state.phase === 'RECOVERY') return LP_RECOVERY.percentage
	return lpStep(state.phase === 'FINISHED' ? LP_BLOCK_STEPS : state.step)
		.percentage
}

/** "RIR 2–3", "RIR 1" or "AMRAP · RIR 0". */
export function lpTargetLabel(target: LpSetTarget, t: T): string {
	if (target.amrap) return t('amrap')
	if (target.rirMin === target.rirMax)
		return t('rirOne', { value: target.rirMin })
	return t('rirRange', { min: target.rirMin, max: target.rirMax })
}

/**
 * The target of the slot's working set at `index` (0-based among its working
 * sets): a RIR target in a block (the final step's while FINISHED), the fixed
 * reps of the recovery step, or null past the prescription.
 */
export function lpSetTargetLabel(
	state: LinearPeriodizationState,
	index: number,
	t: T,
): string | null {
	if (state.phase === 'RECOVERY') {
		return index < LP_RECOVERY.sets
			? t('recoveryReps', { reps: LP_RECOVERY.reps })
			: null
	}
	const step = lpStep(state.phase === 'FINISHED' ? LP_BLOCK_STEPS : state.step)
	const target = step.sets[index]
	return target ? lpTargetLabel(target, t) : null
}

/** The load the slot's next workout prescribes, kg. */
export function lpNextLoadKg(
	state: LinearPeriodizationState,
	incrementKg: number,
): number | null {
	const forState =
		state.phase === 'FINISHED'
			? ({ ...state, phase: 'BLOCK', step: LP_BLOCK_STEPS } as const)
			: state
	return lpPrescription(forState, incrementKg)[0]?.loadKg ?? null
}

/** "Week 3 of 8 · 69 % of 100 kg · 70 kg". */
export function lpSummary(
	state: LinearPeriodizationState,
	options: {
		rotation: boolean
		incrementKg: number
		unit: WeightUnit
		locale: Locale
	},
	t: T,
): string {
	return t('summary', {
		position: lpPositionLabel(state, options.rotation, t),
		percent: lpPercentLabel(lpPercentage(state), options.locale),
		reference: formatWeight(state.referenceMaxKg, options.unit, options.locale),
		load: formatWeight(
			lpNextLoadKg(state, options.incrementKg),
			options.unit,
			options.locale,
		),
	})
}
