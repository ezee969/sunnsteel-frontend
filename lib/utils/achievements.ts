import type {
	AchievementCategory,
	EarnedAchievement,
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
