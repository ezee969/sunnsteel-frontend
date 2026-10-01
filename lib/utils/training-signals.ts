import type {
	DecliningLift,
	TrainingSignalsResponse,
	WeightUnit,
	WorkoutPeriod,
} from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import { intlLocale } from '@/i18n/date-locale'
import type { Translator } from '@/i18n/translator'

import { formatWeightAmount, getWeightUnitLabel } from './weight-unit'

/**
 * PROG-10 copy. Every sentence states a measured number and its window;
 * none names a cause or suggests what to do about it. A marked signal means
 * a printed threshold was crossed, never a conclusion.
 */

type Thresholds = TrainingSignalsResponse['thresholds']
type Signals = TrainingSignalsResponse
type T = Translator<'progress.signals'>

const numberWord = (value: number, t: T) => t('numberWord', { value })
const decimal = (value: number, locale: Locale) =>
	new Intl.NumberFormat(intlLocale(locale), {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	}).format(value)

export const trainingSignalsTitle = (t: T) => t('title')
export const trainingSignalMarkedLabel = (t: T) => t('markedLabel')

export function trainingSignalTitles(t: T) {
	return {
		effort: t('titleEffort'),
		repTargets: t('titleRepTargets'),
		declines: t('titleDeclines'),
		workouts: t('titleWorkouts'),
	} as const
}

export function describePeriods(periodDays: number, t: T) {
	return {
		recent: t('periodRecent', { days: periodDays }),
		previous: t('periodPrevious', { days: periodDays }),
	}
}

export function describeSignalsIntro(thresholds: Thresholds, t: T): string {
	const { recent, previous } = describePeriods(thresholds.periodDays, t)
	return t('intro', { recent, previous })
}

/**
 * UX-17: the one line shown under the heading. The full intro and the rule
 * sit behind "How this works".
 */
export function describeSignalsIntroSummary(
	thresholds: Thresholds,
	t: T,
): string {
	const { recent, previous } = describePeriods(thresholds.periodDays, t)
	return t('introSummary', { recent, previous })
}

export function describeSignalsRule(
	thresholds: Thresholds,
	t: T,
	locale: Locale,
): string {
	return t('rule', {
		rpeRise: decimal(thresholds.rpeRise, locale),
		shortPointsRise: thresholds.shortPointsRise,
		minShortSets: t('sets', { count: thresholds.minShortSets }),
		falls: numberWord(thresholds.declineSessions - 1, t),
		minDecline: decimal(thresholds.minDecline * 100, locale),
		workoutDrop: thresholds.workoutDrop,
	})
}

function describeChange(difference: number, t: T, locale: Locale): string {
	if (difference > 0)
		return t('changeUp', { value: decimal(difference, locale) })
	if (difference < 0)
		return t('changeDown', { value: decimal(-difference, locale) })
	return t('changeNone')
}

const headline = (figure: string, change: string | null, t: T) =>
	change === null ? figure : t('headlineJoin', { figure, change })

/** "7.6, up 0.1": the number a row leads with, or null when there is none. */
export function describeEffortHeadline(
	signals: Signals,
	t: T,
	locale: Locale,
): string | null {
	const { comparison } = signals.effort
	if (!comparison) return null
	return headline(
		decimal(comparison.recent.averageRpe, locale),
		describeChange(comparison.difference, t, locale),
		t,
	)
}

/** "15% short of target, up 10 points". */
export function describeRepTargetsHeadline(
	signals: Signals,
	t: T,
): string | null {
	const { recent, previous, comparable } = signals.repTargets
	if (recent.targetedSets === 0) return null
	const figure = t('headlineRepTargets', { percent: recent.shortPercent })
	if (!comparable || previous.targetedSets === 0) return figure
	const points = recent.shortPercent - previous.shortPercent
	if (points > 0)
		return headline(figure, t('headlinePointsUp', { value: points }), t)
	if (points < 0)
		return headline(figure, t('headlinePointsDown', { value: -points }), t)
	return headline(figure, t('changeNone'), t)
}

/** "1 lift": how many lifts are declining. */
export function describeDeclinesHeadline(signals: Signals, t: T): string {
	return t('lifts', { count: signals.declines.lifts.length })
}

/** "5 workouts, down 3". */
export function describeWorkoutsHeadline(signals: Signals, t: T): string {
	const { recent, previous } = signals.workouts
	const difference = recent.workouts - previous.workouts
	const change =
		difference > 0
			? t('changeUp', { value: String(difference) })
			: difference < 0
				? t('changeDown', { value: String(-difference) })
				: t('changeNone')
	return headline(t('workoutsCount', { count: recent.workouts }), change, t)
}

export function describeEffort(signals: Signals, t: T, locale: Locale): string {
	const { effort, thresholds } = signals
	const { recent, previous } = describePeriods(thresholds.periodDays, t)
	if (!effort.comparison) {
		return t('effortNeedMore', {
			min: thresholds.minRpeSets,
			recentSets: effort.recentSets,
			previousSets: effort.previousSets,
			recent,
			previous,
		})
	}
	const { comparison } = effort
	return t('effort', {
		recentRpe: decimal(comparison.recent.averageRpe, locale),
		recentSets: t('sets', { count: comparison.recent.sets }),
		previousRpe: decimal(comparison.previous.averageRpe, locale),
		previousSets: t('sets', { count: comparison.previous.sets }),
		recent,
		previous,
		change: describeChange(comparison.difference, t, locale),
		lifts: t('lifts', { count: comparison.lifts }),
	})
}

export function describeRepTargets(signals: Signals, t: T): string {
	const { repTargets, thresholds } = signals
	const { recent, previous } = describePeriods(thresholds.periodDays, t)
	const now = repTargets.recent
	const before = repTargets.previous
	const recentPart =
		now.targetedSets === 0
			? t('repTargetsNoneRecent', { recent })
			: t('repTargetsRecent', {
					short: now.shortSets,
					sets: t('sets', { count: now.targetedSets }),
					recent,
					percent: now.shortPercent,
				})
	const previousPart =
		before.targetedSets === 0
			? t('repTargetsNonePrevious', { previous })
			: now.targetedSets === 0
				? t('repTargetsPreviousFull', {
						short: before.shortSets,
						sets: t('sets', { count: before.targetedSets }),
						previous,
						percent: before.shortPercent,
					})
				: t('repTargetsPreviousShort', {
						short: before.shortSets,
						sets: before.targetedSets,
						previous,
						percent: before.shortPercent,
					})
	const parts = [
		t('repTargetsSentence', { recent: recentPart, previous: previousPart }),
	]
	if (repTargets.mostOften.length > 0) {
		parts.push(
			t('repTargetsMostOften', {
				list: repTargets.mostOften
					.map(lift =>
						t('repTargetsMostOftenItem', {
							name: lift.exerciseName,
							count: lift.shortSets,
						}),
					)
					.join(', '),
			}),
		)
	}
	if (!repTargets.comparable) {
		parts.push(t('repTargetsNotComparable', { min: thresholds.minTargetSets }))
	}
	return parts.join(' ')
}

function joinList(items: string[], t: T): string {
	if (items.length <= 1) return items.join('')
	return t('joinLast', {
		head: items.slice(0, -1).join(', '),
		last: items[items.length - 1],
	})
}

/** "Best estimated 1RM 116.7, 113.8, 110.8 kg on …, down 5.1% over …". */
export function describeDecline(
	lift: DecliningLift,
	unit: WeightUnit,
	formatDate: (iso: string) => string,
	t: T,
	locale: Locale,
): string {
	return t('decline', {
		values: lift.sessions
			.map(session =>
				formatWeightAmount(session.estimated1rmKg, unit, locale, 1),
			)
			.join(', '),
		unit: getWeightUnitLabel(unit),
		dates: joinList(
			lift.sessions.map(session => formatDate(session.performedAt)),
			t,
		),
		percent: decimal(lift.declineRatio * 100, locale),
		sessions: numberWord(lift.sessions.length, t),
	})
}

export function describeNoDeclines(signals: Signals, t: T): string {
	const { declines, thresholds } = signals
	if (declines.checkedLifts === 0) {
		return t('noDeclinesNoLifts', {
			sessions: numberWord(thresholds.declineSessions, t),
			days: thresholds.periodDays * 2,
		})
	}
	return t('noDeclines', {
		sessions: numberWord(thresholds.declineSessions - 1, t),
	})
}

function describeWorkoutPeriod(
	period: WorkoutPeriod,
	label: string,
	noun: boolean,
	t: T,
): string {
	if (period.workouts === 0) return t('workoutsNone', { label })
	const count = noun
		? t('workoutsCount', { count: period.workouts })
		: String(period.workouts)
	const parts = [
		t('workoutsIn', { count, label }),
		period.endedEarly === 0
			? t('endedEarlyNone')
			: t('endedEarly', { count: period.endedEarly }),
	]
	if (period.deloads > 0) parts.push(t('onDeload', { count: period.deloads }))
	return parts.join(', ')
}

export function describeWorkouts(
	signals: Signals,
	t: T,
	locale: Locale,
): string {
	const { workouts, thresholds } = signals
	const { recent, previous } = describePeriods(thresholds.periodDays, t)
	const text = t('workoutsSentence', {
		recent: describeWorkoutPeriod(workouts.recent, recent, true, t),
		previous: describeWorkoutPeriod(
			workouts.previous,
			previous,
			workouts.recent.workouts === 0,
			t,
		),
	})
	return text.charAt(0).toLocaleUpperCase(intlLocale(locale)) + text.slice(1)
}
