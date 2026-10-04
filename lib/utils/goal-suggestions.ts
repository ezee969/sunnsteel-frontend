import type {
	GoalSuggestion,
	MeasurableGoal,
	PersonalGoalProgress,
	ReplaceMeasurableGoalsRequest,
	WeightUnit,
} from '@sunsteel/contracts'

import { exerciseLabel } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import { numberFormatter } from '@/i18n/date-locale'
import type { Translator } from '@/i18n/translator'

import { formatWeightAmount, getWeightUnitLabel } from './weight-unit'

/**
 * ACH-06: how a suggested goal reads. Every number is the server's, from the
 * member's own data; this only words it and says where it came from. A
 * suggestion is a proposal, never advice: nothing here tells anyone what
 * they should do.
 */

type T = Translator<'progress.goalSuggestions'>

const weight = (kg: number, unit: WeightUnit, locale: Locale) =>
	`${formatWeightAmount(kg, unit, locale, 0)} ${getWeightUnitLabel(unit)}`

export function describeGoalSuggestion(
	suggestion: GoalSuggestion,
	unit: WeightUnit,
	locale: Locale,
	t: T,
	tExercises: Translator<'catalog.exercises'>,
): { title: string; basis: string } {
	const basis = suggestion.basis
	const title =
		suggestion.type === 'WEEKLY_SESSIONS'
			? t('sessionsTitle', { count: suggestion.targetValue })
			: suggestion.type === 'WEEKLY_VOLUME'
				? t('volumeTitle', {
						value: weight(suggestion.targetValue, unit, locale),
					})
				: t('strengthTitle', {
						exercise: exerciseLabel(
							suggestion.exercise?.name ?? '',
							tExercises,
						),
						value: `${formatWeightAmount(suggestion.targetValue, unit, locale, 1)} ${getWeightUnitLabel(unit)}`,
					})
	const reason =
		basis.kind === 'PLAN'
			? t('basisPlan', { count: basis.plannedWorkouts })
			: basis.kind === 'RECENT_VOLUME'
				? t('basisVolume', {
						weeks: basis.weeks,
						value: weight(basis.averageVolumeKg, unit, locale),
					})
				: t('basisStrength', {
						value: `${formatWeightAmount(basis.bestEstimated1rmKg, unit, locale, 1)} ${getWeightUnitLabel(unit)}`,
						sessions: basis.sessions,
						weeks: Math.round(basis.windowDays / 7),
					})
	return { title, basis: reason }
}

/**
 * The goals write with the suggestion added at the end: every stored goal is
 * sent back as it is, so accepting one never changes another.
 */
export function acceptSuggestionRequest(
	goals: readonly MeasurableGoal[],
	suggestion: GoalSuggestion,
): ReplaceMeasurableGoalsRequest {
	return {
		goals: [
			...goals.map(goal => ({
				id: goal.id,
				type: goal.type,
				targetValue: goal.targetValue,
				direction: goal.direction,
				...(goal.exercise ? { exerciseId: goal.exercise.id } : {}),
			})),
			{
				type: suggestion.type,
				targetValue: suggestion.targetValue,
				direction: suggestion.direction,
				...(suggestion.exercise ? { exerciseId: suggestion.exercise.id } : {}),
			},
		],
	}
}

/**
 * DASH-04: the one line the dashboard's closed Your goals section keeps --
 * how many goals are reached, else how many suggestions wait.
 */
export function dashboardGoalsSummary(
	goals: readonly Pick<PersonalGoalProgress, 'achieved'>[] | undefined,
	suggestions: number,
	t: Translator<'planning.dashboardSummaries'>,
	locale: Locale,
): string | null {
	if (goals?.length) {
		const reached = goals.filter(goal => goal.achieved).length
		const format = numberFormatter(locale, {})
		return t('goalsReached', {
			reached: format.format(reached),
			total: format.format(goals.length),
		})
	}
	return suggestions > 0 ? t('goalsSuggested', { count: suggestions }) : null
}
