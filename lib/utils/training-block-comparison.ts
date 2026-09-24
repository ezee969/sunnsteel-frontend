import type {
	BlockComparisonLift,
	BlockComparisonPeriod,
	TrainingBlockComparisonResponse,
	WeightUnit,
} from '@sunsteel/contracts'

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

export const BLOCK_COMPARISON_ACTION = 'Compare training'

const decimal = (value: number, digits = 1) =>
	new Intl.NumberFormat(undefined, {
		minimumFractionDigits: 0,
		maximumFractionDigits: digits,
	}).format(value)

const plural = (count: number, one: string, many = `${one}s`) =>
	`${decimal(count)} ${count === 1 ? one : many}`

const fromKey = (key: string) => {
	const [year, month, day] = key.split('-').map(Number)
	return new Date(year, month - 1, day)
}
const DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
})
const formatDate = (key: string) => DATE_FORMAT.format(fromKey(key))

/** The block's name, or "The 28 days before". */
export function periodName(period: BlockComparisonPeriod): string {
	return period.name ?? `The ${period.days} days before`
}

export function periodDates(period: BlockComparisonPeriod): string {
	return `${formatDate(period.startDate)} – ${formatDate(period.endDate)}`
}

export function describeComparisonScope(
	comparison: TrainingBlockComparisonResponse,
): string {
	const current = comparison.current
	const previous = comparison.previous
	const scope = comparison.isRunning
		? `${periodName(current)} so far (${plural(current.days, 'day')}) beside the same number of days of ${previous.kind === 'BEFORE_BLOCK' ? 'the routine before it' : periodName(previous)}.`
		: `${periodName(current)} (${plural(current.days, 'day')}) beside ${previous.kind === 'BEFORE_BLOCK' ? 'the same number of days before it' : `${periodName(previous)} (${plural(previous.days, 'day')})`}.`
	const truncated = comparison.truncated
		? ' A period longer than a year is compared on its latest 365 days.'
		: ''
	return `${scope} Only this routine's workouts count. The numbers are side by side, not ranked.${truncated}`
}

/** "up 0.5", "down 2", "no change", with an optional unit after the number. */
export function describeChange(difference: number, unit = ''): string {
	const rounded = Math.round(difference * 10) / 10
	if (rounded === 0) return 'no change'
	const amount = `${decimal(Math.abs(rounded))}${unit}`
	return rounded > 0 ? `up ${amount}` : `down ${amount}`
}

/** A per-week change: "up 0.5 a week", or plain "no change". */
export function describeWeeklyChange(difference: number, unit = ''): string {
	const change = describeChange(difference, unit)
	return change === 'no change' ? change : `${change} a week`
}

export interface ComparisonRow {
	label: string
	previous: string
	current: string
	change: string | null
}

function describeWorkouts(period: BlockComparisonPeriod): string {
	const workouts =
		period.plannedWorkouts === null
			? plural(period.workouts, 'workout')
			: `${period.workouts} of ${period.plannedWorkouts} planned`
	const notes = [
		period.endedEarly ? `${period.endedEarly} ended early` : null,
		period.deloads ? `${period.deloads} on a deload` : null,
	].filter(Boolean)
	return notes.length ? `${workouts} (${notes.join(', ')})` : workouts
}

const load = (kg: number, unit: WeightUnit, digits = 0) =>
	`${formatWeightAmount(kg, unit, digits)} ${getWeightUnitLabel(unit)}`

export function comparisonRows(
	comparison: TrainingBlockComparisonResponse,
	unit: WeightUnit,
): ComparisonRow[] {
	const { current, previous, effort } = comparison
	const rows: ComparisonRow[] = [
		{
			label: 'Workouts',
			previous: describeWorkouts(previous),
			current: describeWorkouts(current),
			change: describeWeeklyChange(
				current.perWeek.workouts - previous.perWeek.workouts,
			),
		},
		{
			label: 'Completed sets',
			previous: `${previous.completedSets} (${decimal(previous.perWeek.completedSets)} a week)`,
			current: `${current.completedSets} (${decimal(current.perWeek.completedSets)} a week)`,
			change: describeWeeklyChange(
				current.perWeek.completedSets - previous.perWeek.completedSets,
			),
		},
		{
			label: 'External load',
			previous: `${load(previous.volumeKg, unit)} (${load(previous.perWeek.volumeKg, unit)} a week)`,
			current: `${load(current.volumeKg, unit)} (${load(current.perWeek.volumeKg, unit)} a week)`,
			change: describeWeeklyChange(
				Math.round(kilogramsToDisplayWeight(current.perWeek.volumeKg, unit)) -
					Math.round(kilogramsToDisplayWeight(previous.perWeek.volumeKg, unit)),
				` ${getWeightUnitLabel(unit)}`,
			),
		},
	]
	rows.push(
		effort.comparison
			? {
					label: 'Average RPE',
					previous: `${decimal(effort.comparison.previous.averageRpe)} over ${plural(effort.comparison.previous.sets, 'set')}`,
					current: `${decimal(effort.comparison.recent.averageRpe)} over ${plural(effort.comparison.recent.sets, 'set')}`,
					change: `${describeChange(effort.comparison.difference)}, on the ${plural(effort.comparison.lifts, 'lift')} rated in both`,
				}
			: {
					label: 'Average RPE',
					previous: `${plural(effort.previousSets, 'set')} with RPE`,
					current: `${plural(effort.recentSets, 'set')} with RPE`,
					change:
						'Comparing needs at least 10 RPE sets of the same lifts in each period.',
				},
	)
	const target = (period: BlockComparisonPeriod) =>
		period.repTargets.targetedSets === 0
			? 'No sets with a rep target'
			: `${period.repTargets.shortSets} of ${period.repTargets.targetedSets} short (${period.repTargets.shortPercent}%)`
	rows.push({
		label: 'Sets short of their rep target',
		previous: target(previous),
		current: target(current),
		change:
			previous.repTargets.targetedSets && current.repTargets.targetedSets
				? describeChange(
						current.repTargets.shortPercent - previous.repTargets.shortPercent,
						' points',
					)
				: null,
	})
	return rows
}

export function describeLift(
	lift: BlockComparisonLift,
	unit: WeightUnit,
): string {
	return (
		`Best estimated 1RM ${load(lift.previous.estimated1rmKg, unit, 1)} → ` +
		`${load(lift.current.estimated1rmKg, unit, 1)}, ${describeChange(lift.changePercent, '%')}`
	)
}

export function describeNoLifts(): string {
	return 'No lift with a loaded set was trained in both periods.'
}
