import {
	type LinearPeriodizationState,
	LP_BLOCK_STEPS,
	LP_PROGRESS_CAP,
	LP_PROGRESS_THRESHOLD,
	LP_RECOVERY,
	type LpRecommendation,
	lpStep,
	type ProgressionScheme,
	type WeightUnit,
} from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import { numberFormatter } from '@/i18n/date-locale'
import type { Translator } from '@/i18n/translator'

import {
	lpNextLoadKg,
	lpPercentLabel,
	lpTargetLabel,
} from './linear-periodization'
import { areCanonicalWeightsEqual, formatWeight } from './weight-unit'

/** Every progression scheme by name; null for a value this build lacks. */
export function progressionSchemeLabel(
	scheme: ProgressionScheme | string | null | undefined,
	t: Translator<'routines.builder'>,
): string | null {
	switch (scheme) {
		case 'NONE':
			return t('progressionNone')
		case 'DOUBLE_PROGRESSION':
			return t('progressionDouble')
		case 'DYNAMIC_DOUBLE_PROGRESSION':
			return t('progressionDynamic')
		case 'LINEAR_PERIODIZATION':
			return t('progressionLinear')
		default:
			return null
	}
}

type T = Translator<'routines.linearBlock'>

/** A share with up to one decimal: 2.5 %, 5 %. */
const precisePercent = (value: number, locale: Locale) =>
	numberFormatter(locale, {
		style: 'percent',
		maximumFractionDigits: 1,
	}).format(value)

/** "+3.5 %" / "−2 %": the estimate against the block's reference. */
export function lpChangeLabel(change: number, locale: Locale): string {
	return numberFormatter(locale, {
		style: 'percent',
		maximumFractionDigits: 1,
		signDisplay: 'exceptZero',
	}).format(change)
}

/**
 * Why the next block's reference is pre-filled as it is (ROUT-19): the rule
 * that matched, with its numbers. It states the evidence and never a cause.
 */
export function lpRecommendationLine(
	recommendation: Pick<LpRecommendation, 'kind' | 'change'>,
	locale: Locale,
	t: T,
): string {
	const threshold = precisePercent(LP_PROGRESS_THRESHOLD, locale)
	switch (recommendation.kind) {
		case 'PROGRESS':
			return t('kindProgress', {
				threshold,
				cap: precisePercent(LP_PROGRESS_CAP, locale),
			})
		case 'RESET':
			return t('kindReset', { threshold })
		default:
			return recommendation.change == null
				? t('kindRepeatNoEstimate')
				: t('kindRepeat', { threshold })
	}
}

/** How a typed reference compares with the finished block's. */
export function lpReferenceHint(
	referenceMaxKg: number,
	nextReferenceMaxKg: number,
	t: T,
): string {
	if (areCanonicalWeightsEqual(referenceMaxKg, nextReferenceMaxKg))
		return t('inputSame')
	return t(
		nextReferenceMaxKg > referenceMaxKg ? 'inputHeavier' : 'inputLighter',
	)
}

/** "Recovery step first: 2 × 5 at 70 % of 100 kg". */
export function lpRecoveryChoiceLabel(
	referenceMaxKg: number,
	unit: WeightUnit,
	locale: Locale,
	t: T,
): string {
	return t('recoveryFirst', {
		sets: LP_RECOVERY.sets,
		reps: LP_RECOVERY.reps,
		percent: lpPercentLabel(LP_RECOVERY.percentage, locale),
		reference: formatWeight(referenceMaxKg, unit, locale),
	})
}

/** "Recovery step: 2 × 5 at 70 kg, then a new block from 105 kg". */
export function lpRecoveryLine(
	state: LinearPeriodizationState,
	incrementKg: number,
	unit: WeightUnit,
	locale: Locale,
	t: T,
): string {
	return t('recoveryLine', {
		sets: LP_RECOVERY.sets,
		reps: LP_RECOVERY.reps,
		load: formatWeight(lpNextLoadKg(state, incrementKg), unit, locale),
		reference: formatWeight(
			state.nextReferenceMaxKg ?? state.referenceMaxKg,
			unit,
			locale,
		),
	})
}

/**
 * A shared routine's LP working set (ROUT-04): the reader's own max stands
 * in for the owner's, so the set is the share of week 1 and its target.
 */
export function lpSharedSetLabel(index: number, locale: Locale, t: T) {
	const step = lpStep(1)
	const target = step.sets[index]
	return t('sharedSet', {
		percent: lpPercentLabel(step.percentage, locale),
		target: target ? lpTargetLabel(target, t) : '—',
	})
}

/** The line under a shared LP exercise: week 1 shown, rising to week 8. */
export function lpSharedTableNote(locale: Locale, t: T) {
	return t('sharedTable', {
		top: lpPercentLabel(lpStep(LP_BLOCK_STEPS).percentage, locale),
	})
}
