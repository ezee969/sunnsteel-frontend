import type {
	ProgressionChange,
	ProgressionSetChange,
	WeightUnit,
} from '@sunsteel/contracts'

import { formatWeightInput, getWeightUnitLabel } from './weight-unit'

export function getProgressionRuleExplanation(
	change: ProgressionChange,
	unit: WeightUnit,
): string {
	const increment =
		formatWeightInput(change.minWeightIncrementKg, unit) +
		' ' +
		getWeightUnitLabel(unit)
	if (change.rule === 'ALL_SETS_REACHED_TARGET') {
		return (
			'All ' +
			change.sets.length +
			' set' +
			(change.sets.length === 1 ? '' : 's') +
			' reached the rep target' +
			(change.sets.length === 1 ? '' : 's') +
			', so every prescribed load advanced by ' +
			increment +
			'.'
		)
	}
	return (
		change.sets.length +
		' set' +
		(change.sets.length === 1 ? '' : 's') +
		' reached the rep target and advanced independently by ' +
		increment +
		'.'
	)
}

export function getProgressionSetPresentation(
	set: ProgressionSetChange,
	unit: WeightUnit,
) {
	const unitLabel = getWeightUnitLabel(unit)
	return {
		setLabel: 'Set ' + set.setNumber,
		repsLabel: set.performedReps + '/' + set.targetReps + ' reps',
		weightLabel:
			formatWeightInput(set.previousWeightKg, unit) +
			' → ' +
			formatWeightInput(set.newWeightKg, unit) +
			' ' +
			unitLabel,
	}
}
