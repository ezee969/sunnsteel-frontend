import type { DashboardInsight } from './dashboard-insights'
import type { UpcomingMilestone } from './dashboard-milestones'

/**
 * UX-02: the one line a closed dashboard section keeps, so it still says
 * what it holds (design system §20.1). Each names a fact the open section
 * already shows and computes nothing of its own; null when there is nothing
 * to name, and the section's own empty state is what shows once opened.
 */

export function recentActivitySummary(
	latest: { routineName: string; dayName: string } | undefined,
	timeAgo: string | undefined,
): string | null {
	if (!latest) return null
	const when = timeAgo ? `, ${timeAgo}` : ''
	return `Latest: ${latest.routineName} — ${latest.dayName}${when}`
}

export function personalRecordSummary(
	latest: { exerciseName: string } | undefined,
	formattedSet: string | undefined,
): string | null {
	if (!latest) return null
	return formattedSet
		? `Latest: ${latest.exerciseName} ${formattedSet}`
		: `Latest: ${latest.exerciseName}`
}

export function trainingInsightsSummary(
	insights: readonly Pick<DashboardInsight, 'key'>[],
): string | null {
	if (insights.length === 0) return null
	return insights.length === 1
		? '1 fact from your recent training'
		: `${insights.length} facts from your recent training`
}

export function upcomingMilestonesSummary(
	milestones: readonly Pick<UpcomingMilestone, 'title'>[],
): string | null {
	if (milestones.length === 0) return null
	const rest = milestones.length - 1
	return rest > 0
		? `Next: ${milestones[0].title}, and ${rest} more`
		: `Next: ${milestones[0].title}`
}
