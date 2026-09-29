import {
	type ExercisePlateau,
	PLATEAU_MIN_SESSIONS,
	PLATEAU_MIN_SESSIONS_MAX,
	PLATEAU_MIN_SESSIONS_MIN,
	type PlateauSet,
	type PlateausResponse,
	type WeightUnit,
} from '@sunsteel/contracts'

import type { Translator } from '@/i18n/translator'

import type { EmptyStateCopy } from './empty-states'
import { formatWeightAmount, getWeightUnitLabel } from './weight-unit'

/**
 * PROG-09 copy. Every sentence states the numbers behind a plateau and none
 * suggests a cause: the rule on automated insights forbids diagnosis.
 */

type Thresholds = PlateausResponse['thresholds']
type T = Translator<'planning.plateaus'>

export function formatSpan(days: number, t: T): string {
	return days % 7 === 0
		? t('weeks', { count: days / 7 })
		: t('days', { count: days })
}

export function describePlateauRule(thresholds: Thresholds, t: T): string {
	return t('rule', {
		minSessions: thresholds.minSessions,
		minDaysSinceBest: formatSpan(thresholds.minDaysSinceBest, t),
		recentDays: formatSpan(thresholds.recentDays, t),
		windowDays: formatSpan(thresholds.windowDays, t),
	})
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
	t: T,
): { headline: string; since: string } {
	const fromWindow = plateau.countedSince > plateau.best.achievedAt
	const date = formatDate(plateau.best.achievedAt)
	return {
		headline: t('noNewBest', { count: plateau.sessionsWithoutNewBest }),
		since: fromWindow
			? t('sinceWindow', { span: formatSpan(thresholds.windowDays, t), date })
			: t('sinceBest', { date }),
	}
}

/**
 * How close the best set since came: "matched that estimate" when it tied
 * the best, otherwise the whole percent (never rounded up to a tie).
 */
export function describeClosestShare(
	ratio: number,
	t: T,
	estimate?: string,
): string {
	const target = estimate ?? t('estimateThat')
	return ratio >= 1
		? t('matched', { estimate: target })
		: t('shareOf', { percent: Math.floor(ratio * 100), estimate: target })
}

/** PREF-05: every minimum the account may choose, smallest first. */
export const PLATEAU_SESSION_OPTIONS: readonly number[] = Array.from(
	{ length: PLATEAU_MIN_SESSIONS_MAX - PLATEAU_MIN_SESSIONS_MIN + 1 },
	(_, index) => PLATEAU_MIN_SESSIONS_MIN + index,
)

export function getPlateauSessionLabel(sessions: number, t: T): string {
	return sessions === PLATEAU_MIN_SESSIONS
		? t('sessionsDefault', { sessions })
		: t('sessionsOption', { sessions })
}

export function getPlateauEmptyState(
	checkedExercises: number,
	thresholds: Thresholds,
	t: T,
): EmptyStateCopy {
	const span = formatSpan(thresholds.recentDays, t)
	if (checkedExercises === 0) {
		return {
			title: t('nothingToCheckTitle'),
			description: t('nothingToCheckDescription', { span }),
		}
	}
	return {
		title: t('noPlateausTitle'),
		description: t('noPlateausDescription', {
			count: checkedExercises,
			span,
			minSessions: thresholds.minSessions,
		}),
	}
}
