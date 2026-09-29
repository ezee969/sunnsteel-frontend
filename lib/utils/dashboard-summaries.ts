import type { Translator } from '@/i18n/translator'

import type { DashboardInsight } from './dashboard-insights'
import type { UpcomingMilestone } from './dashboard-milestones'

/**
 * UX-02: the one line a closed dashboard section keeps, so it still says
 * what it holds (design system §20.1). Each names a fact the open section
 * already shows and computes nothing of its own; null when there is nothing
 * to name, and the section's own empty state is what shows once opened.
 */

type T = Translator<'planning.dashboardSummaries'>

export function recentActivitySummary(
	latest: { routineName: string; dayName: string } | undefined,
	timeAgo: string | undefined,
	t: T,
): string | null {
	if (!latest) return null
	const values = { routine: latest.routineName, day: latest.dayName }
	return timeAgo
		? t('latestWorkoutAgo', { ...values, timeAgo })
		: t('latestWorkout', values)
}

export function personalRecordSummary(
	latest: { exerciseName: string } | undefined,
	formattedSet: string | undefined,
	t: T,
): string | null {
	if (!latest) return null
	return formattedSet
		? t('latestRecordSet', { exercise: latest.exerciseName, set: formattedSet })
		: t('latestRecord', { exercise: latest.exerciseName })
}

export function trainingInsightsSummary(
	insights: readonly Pick<DashboardInsight, 'key'>[],
	t: T,
): string | null {
	if (insights.length === 0) return null
	return t('facts', { count: insights.length })
}

export function upcomingMilestonesSummary(
	milestones: readonly Pick<UpcomingMilestone, 'title'>[],
	t: T,
): string | null {
	if (milestones.length === 0) return null
	const rest = milestones.length - 1
	return rest > 0
		? t('nextMore', { title: milestones[0].title, rest })
		: t('next', { title: milestones[0].title })
}
