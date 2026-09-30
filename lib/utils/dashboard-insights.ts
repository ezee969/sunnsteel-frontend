import type {
	ExercisePlateau,
	PlateausResponse,
	VolumeTrendPoint,
	VolumeTrendResponse,
	WeightUnit,
} from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import type { Translator } from '@/i18n/translator'

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

type T = Translator<'planning.dashboardInsights'>

const SET_FORMATTER = new Intl.NumberFormat('en-US', {
	maximumFractionDigits: 1,
})

const formatWeekTotals = (
	point: VolumeTrendPoint,
	unit: WeightUnit,
	formatWeek: (weekStart: string) => string,
	t: T,
	locale: Locale,
) =>
	t('weekTotals', {
		week: formatWeek(point.weekStart),
		sets: t('sets', { count: point.completedSets }),
		volume: formatWeightAmount(point.volumeKg, unit, locale, 0),
		unit: getWeightUnitLabel(unit),
	})

const describeBest = (
	plateau: ExercisePlateau,
	unit: WeightUnit,
	t: T,
	locale: Locale,
) =>
	t('best', {
		set: formatPlateauSet(plateau.best, unit, locale),
		estimate: formatEstimate(plateau.best, unit, locale),
	})

const describeClosestSince = (
	plateau: ExercisePlateau,
	unit: WeightUnit,
	t: T,
	locale: Locale,
) => t('closestSince', { set: formatPlateauSet(plateau.closest, unit, locale) })

/**
 * The last two *finished* weeks. The current week is partial by definition, so
 * comparing it against a whole one would state a drop that has not happened.
 */
function buildWeekComparison(
	volume: VolumeTrendResponse | undefined,
	unit: WeightUnit,
	formatWeek: (weekStart: string) => string,
	t: T,
	locale: Locale,
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
			? t('weekHeld', { sets: SET_FORMATTER.format(latest) })
			: t('weekChanged', {
					from: SET_FORMATTER.format(previous),
					to: SET_FORMATTER.format(latest),
				})

	return {
		key: 'WEEK_OVER_WEEK',
		label: t('weekLabel'),
		subject: t('weekSubject'),
		// UX-11: the weekly load comparison lives on Progress › Load.
		href: '/progress/load',
		statement,
		evidence: t('weekEvidence', {
			previous: formatWeekTotals(
				previousCompleteWeek,
				unit,
				formatWeek,
				t,
				locale,
			),
			latest: formatWeekTotals(latestCompleteWeek, unit, formatWeek, t, locale),
		}),
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
	t: T,
	tPlateaus: Translator<'planning.plateaus'>,
	locale: Locale,
): DashboardInsight {
	return {
		key: 'CLOSEST_TO_BEST',
		label: t('closestLabel'),
		subject: plateau.exerciseName,
		href: `/exercises/${plateau.exerciseId}`,
		statement: t('closestStatement', {
			share: describeClosestShare(
				plateau.closestRatio,
				tPlateaus,
				t('estimateYourBest'),
			),
		}),
		evidence: t('closestEvidence', {
			best: describeBest(plateau, unit, t, locale),
			closest: describeClosestSince(plateau, unit, t, locale),
		}),
	}
}

function buildLongestPlateauInsight(
	plateau: ExercisePlateau,
	thresholds: PlateausResponse['thresholds'],
	formatDate: (iso: string) => string,
	unit: WeightUnit,
	includeClosestShare: boolean,
	t: T,
	tPlateaus: Translator<'planning.plateaus'>,
	locale: Locale,
): DashboardInsight {
	const count = describePlateauCount(plateau, thresholds, formatDate, tPlateaus)
	const closest = includeClosestShare
		? t('longestEvidenceExtra', {
				closest: describeClosestSince(plateau, unit, t, locale),
				share: describeClosestShare(
					plateau.closestRatio,
					tPlateaus,
					t('estimateYourBest'),
				),
			})
		: ''
	return {
		key: 'LONGEST_PLATEAU',
		label: t('longestLabel'),
		subject: plateau.exerciseName,
		href: `/exercises/${plateau.exerciseId}`,
		statement: t('longestStatement', {
			headline: count.headline,
			since: count.since,
		}),
		evidence: `${describeBest(plateau, unit, t, locale)}${closest}`,
	}
}

export interface DashboardInsightSources {
	plateaus?: PlateausResponse
	volume?: VolumeTrendResponse
	weightUnit: WeightUnit
	/** Injected so the facts are testable without depending on a locale. */
	formatWeek: (weekStart: string) => string
	formatDate: (iso: string) => string
	t: T
	tPlateaus: Translator<'planning.plateaus'>
	locale: Locale
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
	t,
	tPlateaus,
	locale,
}: DashboardInsightSources): DashboardInsight[] {
	const insights: DashboardInsight[] = []

	const weekComparison = buildWeekComparison(
		volume,
		weightUnit,
		formatWeek,
		t,
		locale,
	)
	if (weekComparison) insights.push(weekComparison)

	const list = plateaus?.plateaus ?? []
	const longest = list[0] ?? null
	const closest = findClosestToBest(list)
	const sameLift = longest !== null && longest === closest

	if (closest && !sameLift) {
		insights.push(
			buildClosestInsight(closest, weightUnit, t, tPlateaus, locale),
		)
	}
	if (longest && plateaus) {
		insights.push(
			buildLongestPlateauInsight(
				longest,
				plateaus.thresholds,
				formatDate,
				weightUnit,
				sameLift,
				t,
				tPlateaus,
				locale,
			),
		)
	}

	return insights
}

/** What the facts are drawn from, so no row is read as a wider claim. */
export function describeDashboardInsightSources(
	t: T,
	plateaus?: PlateausResponse,
): string {
	const scope = plateaus
		? t('sourcesWithThreshold', {
				minSessions: plateaus.thresholds.minSessions,
			})
		: t('sourcesPlain')
	return t('sources', { scope })
}

export function getDashboardInsightsEmptyState(t: T): EmptyStateCopy {
	return {
		title: t('emptyTitle'),
		description: t('emptyDescription'),
		action: { kind: 'link', label: t('openProgress'), href: '/progress' },
	}
}
