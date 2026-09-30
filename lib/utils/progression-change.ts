import type {
	ProgressionChange,
	ProgressionSetChange,
	WeightUnit,
} from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import { numberFormatter } from '@/i18n/date-locale'
import type { Translator } from '@/i18n/translator'

import { getWeightUnitLabel, kilogramsToDisplayWeight } from './weight-unit'

// Two decimals, no grouping: English reads exactly as `String()` did before
// the language reached it; Spanish only moves the decimal mark.
function amount(weightKg: number, unit: WeightUnit, locale: Locale) {
	return numberFormatter(locale, {
		maximumFractionDigits: 2,
		useGrouping: false,
	}).format(kilogramsToDisplayWeight(weightKg, unit))
}

export function getProgressionRuleExplanation(
	change: ProgressionChange,
	unit: WeightUnit,
	t: Translator<'progress.progressionChange'>,
	locale: Locale = 'en',
): string {
	const increment =
		amount(change.minWeightIncrementKg, unit, locale) +
		' ' +
		getWeightUnitLabel(unit)
	const values = { count: change.sets.length, increment }
	return change.rule === 'ALL_SETS_REACHED_TARGET'
		? t('allSets', values)
		: t('perSet', values)
}

export function getProgressionSetPresentation(
	set: ProgressionSetChange,
	unit: WeightUnit,
	t: Translator<'progress.progressionChange'>,
	locale: Locale = 'en',
) {
	const unitLabel = getWeightUnitLabel(unit)
	return {
		setLabel: t('setLabel', { number: set.setNumber }),
		repsLabel: t('repsLabel', {
			performed: set.performedReps,
			target: set.targetReps,
		}),
		weightLabel:
			amount(set.previousWeightKg, unit, locale) +
			' → ' +
			amount(set.newWeightKg, unit, locale) +
			' ' +
			unitLabel,
	}
}
