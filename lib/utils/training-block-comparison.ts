import type {
	BlockComparisonLift,
	BlockComparisonPeriod,
	TrainingBlockComparisonResponse,
	WeightUnit,
} from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import { intlLocale } from '@/i18n/date-locale'
import type { Translator } from '@/i18n/translator'

import {
	formatWeightAmount,
	getWeightUnitLabel,
	kilogramsToDisplayWeight,
} from './weight-unit'

/**
 * PROG-11 copy. Two periods are set side by side and every change is stated
 * as a number with its direction; nothing says which period went better,
 * and nothing suggests why a number moved.
 */

type T = Translator<'progress.blockComparison'>

export const blockComparisonAction = (t: T) => t('action')

const decimal = (value: number, locale: Locale, digits = 1) =>
	new Intl.NumberFormat(intlLocale(locale), {
		minimumFractionDigits: 0,
		maximumFractionDigits: digits,
	}).format(value)

const fromKey = (key: string) => {
	const [year, month, day] = key.split('-').map(Number)
	return new Date(year, month - 1, day)
}
const formatDate = (key: string, locale: Locale) =>
	new Intl.DateTimeFormat(intlLocale(locale), {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	}).format(fromKey(key))

/** The block's name, or "The 28 days before". */
export function periodName(period: BlockComparisonPeriod, t: T): string {
	return period.name ?? t('periodBefore', { days: period.days })
}

export function periodDates(
	period: BlockComparisonPeriod,
	t: T,
	locale: Locale,
): string {
	return t('periodDates', {
		start: formatDate(period.startDate, locale),
		end: formatDate(period.endDate, locale),
	})
}

export function describeComparisonScope(
	comparison: TrainingBlockComparisonResponse,
	t: T,
): string {
	const current = comparison.current
	const previous = comparison.previous
	const scope = comparison.isRunning
		? t('scopeRunning', {
				name: periodName(current, t),
				days: t('days', { count: current.days }),
				previous:
					previous.kind === 'BEFORE_BLOCK'
						? t('previousRoutineBefore')
						: periodName(previous, t),
			})
		: t('scopeFinished', {
				name: periodName(current, t),
				days: t('days', { count: current.days }),
				previous:
					previous.kind === 'BEFORE_BLOCK'
						? t('previousSameDaysBefore')
						: t('previousNamed', {
								name: periodName(previous, t),
								days: t('days', { count: previous.days }),
							}),
			})
	return t('scope', {
		scope,
		truncated: comparison.truncated ? t('truncated') : '',
	})
}

/** "up 0.5", "down 2", "no change", with an optional unit after the number. */
export function describeChange(
	difference: number,
	t: T,
	locale: Locale,
	unit = '',
): string {
	const rounded = Math.round(difference * 10) / 10
	if (rounded === 0) return t('noChange')
	const amount = `${decimal(Math.abs(rounded), locale)}${unit}`
	return rounded > 0 ? t('changeUp', { amount }) : t('changeDown', { amount })
}

/** A per-week change: "up 0.5 a week", or plain "no change". */
export function describeWeeklyChange(
	difference: number,
	t: T,
	locale: Locale,
	unit = '',
): string {
	const change = describeChange(difference, t, locale, unit)
	return change === t('noChange') ? change : t('perWeek', { change })
}

export interface ComparisonRow {
	label: string
	previous: string
	current: string
	change: string | null
}

function describeWorkouts(period: BlockComparisonPeriod, t: T): string {
	const workouts =
		period.plannedWorkouts === null
			? t('workoutsCount', { count: period.workouts })
			: t('workoutsPlanned', {
					done: period.workouts,
					planned: period.plannedWorkouts,
				})
	const notes = [
		period.endedEarly ? t('endedEarly', { count: period.endedEarly }) : null,
		period.deloads ? t('onDeload', { count: period.deloads }) : null,
	].filter(Boolean)
	return notes.length
		? t('workoutsWithNotes', { workouts, notes: notes.join(', ') })
		: workouts
}

const load = (kg: number, unit: WeightUnit, digits = 0) =>
	`${formatWeightAmount(kg, unit, digits)} ${getWeightUnitLabel(unit)}`

export function comparisonRows(
	comparison: TrainingBlockComparisonResponse,
	unit: WeightUnit,
	t: T,
	locale: Locale,
): ComparisonRow[] {
	const { current, previous, effort } = comparison
	const rows: ComparisonRow[] = [
		{
			label: t('rowWorkouts'),
			previous: describeWorkouts(previous, t),
			current: describeWorkouts(current, t),
			change: describeWeeklyChange(
				current.perWeek.workouts - previous.perWeek.workouts,
				t,
				locale,
			),
		},
		{
			label: t('rowCompletedSets'),
			previous: t('valuePerWeek', {
				total: previous.completedSets,
				perWeek: decimal(previous.perWeek.completedSets, locale),
			}),
			current: t('valuePerWeek', {
				total: current.completedSets,
				perWeek: decimal(current.perWeek.completedSets, locale),
			}),
			change: describeWeeklyChange(
				current.perWeek.completedSets - previous.perWeek.completedSets,
				t,
				locale,
			),
		},
		{
			label: t('rowExternalLoad'),
			previous: t('valuePerWeek', {
				total: load(previous.volumeKg, unit),
				perWeek: load(previous.perWeek.volumeKg, unit),
			}),
			current: t('valuePerWeek', {
				total: load(current.volumeKg, unit),
				perWeek: load(current.perWeek.volumeKg, unit),
			}),
			change: describeWeeklyChange(
				Math.round(kilogramsToDisplayWeight(current.perWeek.volumeKg, unit)) -
					Math.round(kilogramsToDisplayWeight(previous.perWeek.volumeKg, unit)),
				t,
				locale,
				` ${getWeightUnitLabel(unit)}`,
			),
		},
	]
	rows.push(
		effort.comparison
			? {
					label: t('rowAverageRpe'),
					previous: t('rpeOverSets', {
						rpe: decimal(effort.comparison.previous.averageRpe, locale),
						sets: t('sets', { count: effort.comparison.previous.sets }),
					}),
					current: t('rpeOverSets', {
						rpe: decimal(effort.comparison.recent.averageRpe, locale),
						sets: t('sets', { count: effort.comparison.recent.sets }),
					}),
					change: t('rpeChange', {
						change: describeChange(effort.comparison.difference, t, locale),
						lifts: t('lifts', { count: effort.comparison.lifts }),
					}),
				}
			: {
					label: t('rowAverageRpe'),
					previous: t('setsWithRpe', {
						sets: t('sets', { count: effort.previousSets }),
					}),
					current: t('setsWithRpe', {
						sets: t('sets', { count: effort.recentSets }),
					}),
					change: t('rpeNotComparable'),
				},
	)
	const target = (period: BlockComparisonPeriod) =>
		period.repTargets.targetedSets === 0
			? t('noTargetedSets')
			: t('targetShort', {
					short: period.repTargets.shortSets,
					targeted: period.repTargets.targetedSets,
					percent: period.repTargets.shortPercent,
				})
	rows.push({
		label: t('rowRepTargets'),
		previous: target(previous),
		current: target(current),
		change:
			previous.repTargets.targetedSets && current.repTargets.targetedSets
				? describeChange(
						current.repTargets.shortPercent - previous.repTargets.shortPercent,
						t,
						locale,
						t('points'),
					)
				: null,
	})
	return rows
}

export function describeLift(
	lift: BlockComparisonLift,
	unit: WeightUnit,
	t: T,
	locale: Locale,
): string {
	return t('liftChange', {
		previous: load(lift.previous.estimated1rmKg, unit, 1),
		current: load(lift.current.estimated1rmKg, unit, 1),
		change: describeChange(lift.changePercent, t, locale, '%'),
	})
}

export function describeNoLifts(t: T): string {
	return t('noLifts')
}
