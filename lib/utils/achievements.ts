import type {
	AchievementCategory,
	AchievementCategoryProgress,
	ComebackRecognition,
	EarnedAchievement,
	PublicProfileAchievements,
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

export function hasVisibleProfileAchievements(
	data?: PublicProfileAchievements,
): boolean {
	return Boolean(
		data &&
		(data.rank ||
			data.achievements.length ||
			data.comeback?.recognitions.length),
	)
}

export function orderMilestoneProgress(
	progress: AchievementCategoryProgress[],
): AchievementCategoryProgress[] {
	return ACHIEVEMENT_CATEGORY_ORDER.flatMap(category => {
		const item = progress.find(candidate => candidate.category === category)
		return item ? [item] : []
	})
}

const formatProgressNumber = (value: number) =>
	value.toLocaleString('en-US', { maximumFractionDigits: 2 })

const progressUnit = (category: AchievementCategory, value: number): string => {
	switch (category) {
		case 'SESSIONS':
			return value === 1 ? 'session' : 'sessions'
		case 'SETS':
			return value === 1 ? 'set' : 'sets'
		case 'VOLUME_KG':
			return 'kg'
		case 'RECORDS':
			return value === 1 ? 'exercise' : 'exercises'
		case 'STREAK_DAYS':
			return value === 1 ? 'training day' : 'training days'
	}
}

export function formatMilestoneProgressEvidence(
	progress: AchievementCategoryProgress,
): string {
	const current = formatProgressNumber(progress.currentValue)
	if (!progress.nextMilestone) {
		return `${current} ${progressUnit(progress.category, progress.currentValue)} total`
	}

	const target = formatProgressNumber(progress.nextMilestone.threshold)
	if (progress.category === 'STREAK_DAYS') {
		return `Best ${current} / next ${target} training days`
	}
	return `${current} / ${target} ${progressUnit(progress.category, progress.nextMilestone.threshold)}`
}

export function formatMilestoneProgressDetail(
	progress: AchievementCategoryProgress,
): string {
	if (!progress.nextMilestone) {
		return 'The five fixed milestones in this category are complete.'
	}

	const remaining = formatProgressNumber(progress.remaining)
	switch (progress.category) {
		case 'SESSIONS':
			return `${remaining} more ${progress.remaining === 1 ? 'session' : 'sessions'}, within your own schedule.`
		case 'SETS':
			return `${remaining} more completed ${progress.remaining === 1 ? 'set' : 'sets'} in planned training.`
		case 'VOLUME_KG':
			return 'Cumulative completed-set history; there is no deadline and load should follow your plan.'
		case 'RECORDS':
			return `${remaining} more ${progress.remaining === 1 ? 'exercise record' : 'exercise records'} through normal training.`
		case 'STREAK_DAYS':
			return 'Uses your best recorded streak; recovery days between sessions are compatible.'
	}
}

export function formatAchievementDate(value: string): string {
	return new Intl.DateTimeFormat(undefined, {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	}).format(new Date(value))
}

export function formatComebackEvidence(comeback: ComebackRecognition): string {
	return `${comeback.inactiveDays} full days away · ${comeback.activeDays} active days in ${comeback.windowDays} days`
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
