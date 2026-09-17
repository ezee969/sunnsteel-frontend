import type {
	ExercisePlateau,
	PlateausResponse,
	VolumeTrendPoint,
	VolumeTrendResponse,
	WeightUnit,
} from '@sunsteel/contracts'

import type { EmptyStateCopy } from './empty-states'
import {
	describeClosestShare,
	describePlateauCount,
	formatEstimate,
	formatPlateauSet,
} from './plateaus'
import { getVolumeTrendSummary } from './volume-trend'
import { formatWeightAmount, getWeightUnitLabel } from './weight-unit'

/**
 * DASH-07 states facts the product already computes: the `DATA-03` weekly
 * rollup and the shipped `PROG-09` plateau watch. It runs no analysis of its
 * own and names no cause — the retained rule is evidence first, never a
 * diagnosis. `ACH-04` output belongs to `DASH-09` on this screen, so nothing
 * here repeats a milestone.
 */
export interface DashboardInsight {
	key: string
	/** Row caption: what kind of fact this is. */
	label: string
	/** What the fact is about, and the row's heading. */
	subject: string
	/** Where the fact is owned; the subject links there. */
	href: string
	/** The fact itself, with no cause attached. */
	statement: string
	/** The exact numbers behind it. */
	evidence: string
}

const SET_FORMATTER = new Intl.NumberFormat('en-US', {
	maximumFractionDigits: 1,
})

const formatSets = (value: number) =>
	`${SET_FORMATTER.format(value)} ${value === 1 ? 'set' : 'sets'}`

const formatWeekTotals = (
	point: VolumeTrendPoint,
	unit: WeightUnit,
	formatWeek: (weekStart: string) => string,
) =>
	`${formatWeek(point.weekStart)}: ${formatSets(point.completedSets)} · ` +
	`${formatWeightAmount(point.volumeKg, unit, 0)} ${getWeightUnitLabel(unit)}`

const describeBest = (plateau: ExercisePlateau, unit: WeightUnit) =>
	`Best ${formatPlateauSet(plateau.best, unit)} · est. 1RM ${formatEstimate(plateau.best, unit)}`

const describeClosestSince = (plateau: ExercisePlateau, unit: WeightUnit) =>
	`closest since ${formatPlateauSet(plateau.closest, unit)}`

/**
 * The last two *finished* weeks. The current week is partial by definition, so
 * comparing it against a whole one would state a drop that has not happened.
 */
function buildWeekComparison(
	volume: VolumeTrendResponse | undefined,
	unit: WeightUnit,
	formatWeek: (weekStart: string) => string,
): DashboardInsight | null {
	if (!volume) return null

	const { latestCompleteWeek, previousCompleteWeek } = getVolumeTrendSummary(
		volume.overall,
	)
	if (!latestCompleteWeek || !previousCompleteWeek) return null

	const latest = latestCompleteWeek.completedSets
	const previous = previousCompleteWeek.completedSets
	const statement =
		latest === previous
			? `Completed sets held at ${SET_FORMATTER.format(latest)}.`
			: `Completed sets went from ${SET_FORMATTER.format(previous)} to ${SET_FORMATTER.format(latest)}.`

	return {
		key: 'WEEK_OVER_WEEK',
		label: 'Week over week',
		subject: 'Last two finished weeks',
		href: '/progress',
		statement,
		evidence:
			`${formatWeekTotals(previousCompleteWeek, unit, formatWeek)} → ` +
			`${formatWeekTotals(latestCompleteWeek, unit, formatWeek)}`,
	}
}

/** Highest share of its own best; the longest-running lift wins a tie. */
function findClosestToBest(
	plateaus: ExercisePlateau[],
): ExercisePlateau | null {
	return plateaus.reduce<ExercisePlateau | null>(
		(best, plateau) =>
			best && best.closestRatio >= plateau.closestRatio ? best : plateau,
		null,
	)
}

function buildClosestInsight(
	plateau: ExercisePlateau,
	unit: WeightUnit,
): DashboardInsight {
	return {
		key: 'CLOSEST_TO_BEST',
		label: 'Closest to a new best',
		subject: plateau.exerciseName,
		href: `/exercises/${plateau.exerciseId}`,
		statement: `Best set since: ${describeClosestShare(plateau.closestRatio, 'your best estimate')}.`,
		evidence: `${describeBest(plateau, unit)} — ${describeClosestSince(plateau, unit)}`,
	}
}

function buildLongestPlateauInsight(
	plateau: ExercisePlateau,
	thresholds: PlateausResponse['thresholds'],
	formatDate: (iso: string) => string,
	unit: WeightUnit,
	includeClosestShare: boolean,
): DashboardInsight {
	const count = describePlateauCount(plateau, thresholds, formatDate)
	const closest = includeClosestShare
		? ` — ${describeClosestSince(plateau, unit)}, ${describeClosestShare(plateau.closestRatio, 'your best estimate')}`
		: ''
	return {
		key: 'LONGEST_PLATEAU',
		label: 'Longest without a new best',
		subject: plateau.exerciseName,
		href: `/exercises/${plateau.exerciseId}`,
		statement: `${count.headline} ${count.since}.`,
		evidence: `${describeBest(plateau, unit)}${closest}`,
	}
}

export interface DashboardInsightSources {
	plateaus?: PlateausResponse
	volume?: VolumeTrendResponse
	weightUnit: WeightUnit
	/** Injected so the facts are testable without depending on a locale. */
	formatWeek: (weekStart: string) => string
	formatDate: (iso: string) => string
}

/**
 * A fixed order, never a ranking: the weekly comparison, then the lift closest
 * to its best, then the one longest without one. A source with nothing to say
 * contributes no row rather than an empty one, and one lift never fills two
 * rows — when it is both, the closest share joins its plateau evidence.
 */
export function buildDashboardInsights({
	plateaus,
	volume,
	weightUnit,
	formatWeek,
	formatDate,
}: DashboardInsightSources): DashboardInsight[] {
	const insights: DashboardInsight[] = []

	const weekComparison = buildWeekComparison(volume, weightUnit, formatWeek)
	if (weekComparison) insights.push(weekComparison)

	const list = plateaus?.plateaus ?? []
	const longest = list[0] ?? null
	const closest = findClosestToBest(list)
	const sameLift = longest !== null && longest === closest

	if (closest && !sameLift) {
		insights.push(buildClosestInsight(closest, weightUnit))
	}
	if (longest && plateaus) {
		insights.push(
			buildLongestPlateauInsight(
				longest,
				plateaus.thresholds,
				formatDate,
				weightUnit,
				sameLift,
			),
		)
	}

	return insights
}

/** What the facts are drawn from, so no row is read as a wider claim. */
export function describeDashboardInsightSources(
	plateaus?: PlateausResponse,
): string {
	const scope = plateaus
		? `the lifts your plateau watch follows at ${plateaus.thresholds.minSessions} sessions without a new best`
		: 'the lifts your plateau watch follows'
	return `From your finished training weeks and ${scope}. These are your numbers, not a diagnosis.`
}

export const DASHBOARD_INSIGHTS_EMPTY_STATE: EmptyStateCopy = {
	title: 'Nothing to state yet',
	description:
		'Facts appear once you have two finished training weeks, or a lift your plateau watch is following.',
	action: { kind: 'link', label: 'Open progress', href: '/progress' },
}
