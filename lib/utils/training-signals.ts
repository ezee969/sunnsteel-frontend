import type {
	DecliningLift,
	TrainingSignalsResponse,
	WeightUnit,
	WorkoutPeriod,
} from '@sunsteel/contracts'

import { formatWeightAmount, getWeightUnitLabel } from './weight-unit'

/**
 * PROG-10 copy. Every sentence states a measured number and its window;
 * none names a cause or suggests what to do about it. A marked signal means
 * a printed threshold was crossed, never a conclusion.
 */

type Thresholds = TrainingSignalsResponse['thresholds']
type Signals = TrainingSignalsResponse

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six']
const numberWord = (value: number) => NUMBER_WORDS[value] ?? String(value)
const plural = (count: number, one: string, many = `${one}s`) =>
	`${count} ${count === 1 ? one : many}`
const decimal = (value: number) =>
	new Intl.NumberFormat(undefined, {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	}).format(value)

export const TRAINING_SIGNALS_TITLE = 'Training signals'
export const TRAINING_SIGNAL_MARKED_LABEL = 'Changed'

export const TRAINING_SIGNAL_TITLES = {
	effort: 'Effort (RPE)',
	repTargets: 'Rep targets',
	declines: 'Declining lifts',
	workouts: 'Workouts',
} as const

export function describePeriods(periodDays: number) {
	return {
		recent: `the last ${periodDays} days`,
		previous: `the ${periodDays} days before`,
	}
}

export function describeSignalsIntro(thresholds: Thresholds): string {
	const { recent, previous } = describePeriods(thresholds.periodDays)
	return `Four measures from your logged workouts, ${recent} beside ${previous}. They state what changed, not why.`
}

export function describeSignalsRule(thresholds: Thresholds): string {
	const falls = numberWord(thresholds.declineSessions - 1)
	return (
		`A measure is marked when average RPE rises ${decimal(thresholds.rpeRise)} or more, ` +
		`the share of sets short of their rep target rises ${thresholds.shortPointsRise} points ` +
		`(at least ${plural(thresholds.minShortSets, 'set')}), a lift's best estimated 1RM falls ` +
		`in each of its last ${falls} sessions by ${decimal(thresholds.minDecline * 100)}% in total, ` +
		`or you trained at least ${thresholds.workoutDrop} fewer times or ended more workouts early. ` +
		`Deload workouts count only as workouts.`
	)
}

function describeChange(difference: number): string {
	if (difference > 0) return `up ${decimal(difference)}`
	if (difference < 0) return `down ${decimal(-difference)}`
	return 'no change'
}

export function describeEffort(signals: Signals): string {
	const { effort, thresholds } = signals
	const { recent, previous } = describePeriods(thresholds.periodDays)
	if (!effort.comparison) {
		return (
			`Log RPE on at least ${thresholds.minRpeSets} sets of the same lifts in both periods to compare. ` +
			`So far: ${effort.recentSets} in ${recent}, ${effort.previousSets} in ${previous}.`
		)
	}
	const { comparison } = effort
	return (
		`Average RPE ${decimal(comparison.recent.averageRpe)} over ${plural(comparison.recent.sets, 'set')} in ${recent}, ` +
		`${decimal(comparison.previous.averageRpe)} over ${plural(comparison.previous.sets, 'set')} in ${previous}, ` +
		`${describeChange(comparison.difference)}. Counted on the ${plural(comparison.lifts, 'lift')} you logged with RPE in both.`
	)
}

export function describeRepTargets(signals: Signals): string {
	const { repTargets, thresholds } = signals
	const { recent, previous } = describePeriods(thresholds.periodDays)
	const now = repTargets.recent
	const before = repTargets.previous
	const recentPart =
		now.targetedSets === 0
			? `No sets had a rep target in ${recent}`
			: `${now.shortSets} of ${plural(now.targetedSets, 'set')} fell short of their rep target in ${recent} (${now.shortPercent}%)`
	const previousPart =
		before.targetedSets === 0
			? `none had one in ${previous}`
			: now.targetedSets === 0
				? `${before.shortSets} of ${plural(before.targetedSets, 'set')} fell short in ${previous} (${before.shortPercent}%)`
				: `${before.shortSets} of ${before.targetedSets} in ${previous} (${before.shortPercent}%)`
	const sentence = `${recentPart}; ${previousPart}.`
	const parts = [sentence]
	if (repTargets.mostOften.length > 0) {
		parts.push(
			`Most often: ${repTargets.mostOften
				.map(lift => `${lift.exerciseName} (${lift.shortSets})`)
				.join(', ')}.`,
		)
	}
	if (!repTargets.comparable) {
		parts.push(
			`Comparing needs at least ${thresholds.minTargetSets} sets with a rep target in each period.`,
		)
	}
	return parts.join(' ')
}

function joinList(items: string[]): string {
	if (items.length <= 1) return items.join('')
	return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/** "Best estimated 1RM 116.7, 113.8, 110.8 kg on …, down 5.1% over …". */
export function describeDecline(
	lift: DecliningLift,
	unit: WeightUnit,
	formatDate: (iso: string) => string,
): string {
	const values = lift.sessions
		.map(session => formatWeightAmount(session.estimated1rmKg, unit, 1))
		.join(', ')
	const dates = joinList(
		lift.sessions.map(session => formatDate(session.performedAt)),
	)
	return (
		`Best estimated 1RM ${values} ${getWeightUnitLabel(unit)} on ${dates}, ` +
		`down ${decimal(lift.declineRatio * 100)}% over its last ${numberWord(lift.sessions.length)} sessions.`
	)
}

export function describeNoDeclines(signals: Signals): string {
	const { declines, thresholds } = signals
	if (declines.checkedLifts === 0) {
		return `No lift has ${numberWord(thresholds.declineSessions)} sessions in the last ${thresholds.periodDays * 2} days to compare.`
	}
	return `No lift's best estimated 1RM fell in each of its last ${numberWord(thresholds.declineSessions - 1)} sessions.`
}

function describeWorkoutPeriod(
	period: WorkoutPeriod,
	label: string,
	noun: boolean,
): string {
	if (period.workouts === 0) return `no workouts in ${label}`
	const count = noun
		? plural(period.workouts, 'workout')
		: String(period.workouts)
	const parts = [
		`${count} in ${label}`,
		period.endedEarly === 0
			? 'none ended early'
			: `${period.endedEarly} ended early`,
	]
	if (period.deloads > 0) parts.push(`${period.deloads} on a deload`)
	return parts.join(', ')
}

export function describeWorkouts(signals: Signals): string {
	const { workouts, thresholds } = signals
	const { recent, previous } = describePeriods(thresholds.periodDays)
	const text = `${describeWorkoutPeriod(workouts.recent, recent, true)}; ${describeWorkoutPeriod(workouts.previous, previous, workouts.recent.workouts === 0)}.`
	return text.charAt(0).toUpperCase() + text.slice(1)
}
