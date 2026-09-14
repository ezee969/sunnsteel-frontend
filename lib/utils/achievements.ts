import type {
	AchievementCategory,
	EarnedAchievement,
	RenaissanceRankProgress,
} from '@sunsteel/contracts'

export const ACHIEVEMENT_CATEGORY_ORDER: readonly AchievementCategory[] = [
	'SESSIONS',
	'SETS',
	'VOLUME_KG',
	'RECORDS',
	'STREAK_DAYS',
]

export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, string> =
	{
		SESSIONS: 'Sessions',
		SETS: 'Completed sets',
		VOLUME_KG: 'Training volume',
		RECORDS: 'Personal records',
		STREAK_DAYS: 'Training streaks',
	}

export function groupAchievements(achievements: EarnedAchievement[]) {
	return ACHIEVEMENT_CATEGORY_ORDER.flatMap(category => {
		const items = achievements
			.filter(achievement => achievement.category === category)
			.toSorted((left, right) => right.threshold - left.threshold)
		return items.length ? [{ category, items }] : []
	})
}

export function formatAchievementDate(value: string): string {
	return new Intl.DateTimeFormat(undefined, {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	}).format(new Date(value))
}

const countLabel = (value: number, singular: string, plural: string) =>
	`${value.toLocaleString()} ${value === 1 ? singular : plural}`

export function formatRankEvidence(rank: RenaissanceRankProgress): string {
	return `${countLabel(rank.completedSessions, 'session', 'sessions')} · ${countLabel(rank.activeWeeks, 'active week', 'active weeks')}`
}

export function formatNextRankRequirements(
	rank: RenaissanceRankProgress,
): string | null {
	if (!rank.nextRank) return null

	const sessions = rank.sessionsRemaining
		? `${countLabel(rank.sessionsRemaining, 'more session', 'more sessions')}`
		: 'Session requirement met'
	const weeks = rank.activeWeeksRemaining
		? `${countLabel(rank.activeWeeksRemaining, 'more active week', 'more active weeks')}`
		: 'Active-week requirement met'
	return `${sessions} · ${weeks}`
}
