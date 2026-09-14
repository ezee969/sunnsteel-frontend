import type {
	ExercisePlateau,
	PlateauSet,
	PlateausResponse,
	WeightUnit,
} from '@sunsteel/contracts'

import type { EmptyStateCopy } from './empty-states'
import { formatWeightAmount, getWeightUnitLabel } from './weight-unit'

/**
 * PROG-09 copy. Every sentence states the numbers behind a plateau and none
 * suggests a cause: the rule on automated insights forbids diagnosis.
 */

type Thresholds = PlateausResponse['thresholds']

export function formatSpan(days: number): string {
	if (days % 7 === 0) {
		const weeks = days / 7
		return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`
	}
	return `${days} ${days === 1 ? 'day' : 'days'}`
}

export function describePlateauRule(thresholds: Thresholds): string {
	return (
		`Lifts trained at least ${thresholds.minSessions} times since their current best, ` +
		`with that best at least ${formatSpan(thresholds.minDaysSinceBest)} old and the lift ` +
		`trained in the last ${formatSpan(thresholds.recentDays)}, looking back ` +
		`${formatSpan(thresholds.windowDays)}. These are your numbers, not a diagnosis.`
	)
}

export function formatPlateauSet(set: PlateauSet, unit: WeightUnit): string {
	return `${formatWeightAmount(set.weightKg, unit, 2)} ${getWeightUnitLabel(unit)} × ${set.reps}`
}

export function formatEstimate(set: PlateauSet, unit: WeightUnit): string {
	return `${formatWeightAmount(set.estimated1rmKg, unit, 1)} ${getWeightUnitLabel(unit)}`
}

/** "No new best in 5 sessions" plus where the count started. */
export function describePlateauCount(
	plateau: ExercisePlateau,
	thresholds: Thresholds,
	formatDate: (iso: string) => string,
): { headline: string; since: string } {
	const sessions = plateau.sessionsWithoutNewBest
	const fromWindow = plateau.countedSince > plateau.best.achievedAt
	return {
		headline: `No new best in ${sessions} ${sessions === 1 ? 'session' : 'sessions'}`,
		since: fromWindow
			? `in the last ${formatSpan(thresholds.windowDays)}; best set on ${formatDate(plateau.best.achievedAt)}`
			: `since your best on ${formatDate(plateau.best.achievedAt)}`,
	}
}

/** Whole percent of the best estimate, never rounded up to 100. */
/**
 * How close the best set since came: "matched that estimate" when it tied
 * the best, otherwise the whole percent (never rounded up to a tie).
 */
export function describeClosestShare(
	ratio: number,
	estimate = 'that estimate',
): string {
	return ratio >= 1
		? `matched ${estimate}`
		: `${Math.floor(ratio * 100)}% of ${estimate}`
}

export function getPlateauEmptyState(
	checkedExercises: number,
	thresholds: Thresholds,
): EmptyStateCopy {
	if (checkedExercises === 0) {
		return {
			title: 'Nothing to check yet',
			description: `Plateau watch needs a lift with a loaded best set that you trained in the last ${formatSpan(thresholds.recentDays)}.`,
		}
	}
	const lifts = checkedExercises === 1 ? 'lift' : 'lifts'
	return {
		title: 'No plateaus right now',
		description: `None of the ${checkedExercises} ${lifts} you trained in the last ${formatSpan(thresholds.recentDays)} has gone ${thresholds.minSessions} sessions without a new best.`,
	}
}
