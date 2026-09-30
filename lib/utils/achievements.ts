import type {
	AchievementCategory,
	AchievementCategoryProgress,
	ComebackRecognition,
	EarnedAchievement,
	PublicProfileAchievements,
	RenaissanceRankProgress,
} from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import { dateFormatter, numberFormatter } from '@/i18n/date-locale'
import type { MessageKey, Translator } from '@/i18n/translator'

export const ACHIEVEMENT_CATEGORY_ORDER: readonly AchievementCategory[] = [
	'SESSIONS',
	'SETS',
	'VOLUME_KG',
	'RECORDS',
	'STREAK_DAYS',
]

const CATEGORY_KEYS: Record<
	AchievementCategory,
	MessageKey<'achievements.categories'>
> = {
	SESSIONS: 'SESSIONS',
	SETS: 'SETS',
	VOLUME_KG: 'VOLUME_KG',
	RECORDS: 'RECORDS',
	STREAK_DAYS: 'STREAK_DAYS',
}

export function achievementCategoryLabel(
	category: AchievementCategory,
	t: Translator<'achievements.categories'>,
): string {
	const key: MessageKey<'achievements.categories'> = CATEGORY_KEYS[category]
	return t(key)
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

// The app's language, not the device's and not a hard-coded 'en-US':
// `49.250,5` in Spanish, `49,250.5` in English.
const formatProgressNumber = (value: number, locale: Locale) =>
	numberFormatter(locale, { maximumFractionDigits: 2 }).format(value)

const progressUnit = (
	category: AchievementCategory,
	value: number,
	t: Translator<'achievements.progress'>,
): string => {
	switch (category) {
		case 'SESSIONS':
			return t('unitSessions', { count: value })
		case 'SETS':
			return t('unitSets', { count: value })
		case 'VOLUME_KG':
			return t('unitKg')
		case 'RECORDS':
			return t('unitRecords', { count: value })
		case 'STREAK_DAYS':
			return t('unitStreakDays', { count: value })
	}
}

export function formatMilestoneProgressEvidence(
	progress: AchievementCategoryProgress,
	locale: Locale,
	t: Translator<'achievements.progress'>,
): string {
	const current = formatProgressNumber(progress.currentValue, locale)
	if (!progress.nextMilestone) {
		return t('evidenceTotal', {
			current,
			unit: progressUnit(progress.category, progress.currentValue, t),
		})
	}

	const target = formatProgressNumber(progress.nextMilestone.threshold, locale)
	if (progress.category === 'STREAK_DAYS') {
		return t('evidenceStreak', { current, target })
	}
	return t('evidenceRatio', {
		current,
		target,
		unit: progressUnit(progress.category, progress.nextMilestone.threshold, t),
	})
}

export function formatMilestoneProgressDetail(
	progress: AchievementCategoryProgress,
	locale: Locale,
	t: Translator<'achievements.progress'>,
): string {
	if (!progress.nextMilestone) {
		return t('detailComplete')
	}

	const remaining = formatProgressNumber(progress.remaining, locale)
	const values = { remaining, count: progress.remaining }
	switch (progress.category) {
		case 'SESSIONS':
			return t('detailSessions', values)
		case 'SETS':
			return t('detailSets', values)
		case 'VOLUME_KG':
			return t('detailVolume')
		case 'RECORDS':
			return t('detailRecords', values)
		case 'STREAK_DAYS':
			return t('detailStreak')
	}
}

export function formatAchievementDate(value: string, locale: Locale): string {
	return dateFormatter(locale, {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	}).format(new Date(value))
}

export function formatComebackEvidence(
	comeback: Pick<
		ComebackRecognition,
		'inactiveDays' | 'activeDays' | 'windowDays'
	>,
	t: Translator<'achievements.comeback'>,
): string {
	return t('evidence', {
		inactiveDays: comeback.inactiveDays,
		activeDays: comeback.activeDays,
		windowDays: comeback.windowDays,
	})
}

export function formatRankEvidence(
	rank: RenaissanceRankProgress,
	t: Translator<'achievements.rank'>,
): string {
	return t('evidence', {
		sessions: rank.completedSessions,
		weeks: rank.activeWeeks,
	})
}

export function formatNextRankRequirements(
	rank: RenaissanceRankProgress,
	t: Translator<'achievements.rank'>,
): string | null {
	if (!rank.nextRank) return null

	const sessions = rank.sessionsRemaining
		? t('nextSessions', { count: rank.sessionsRemaining })
		: t('nextSessionsMet')
	const weeks = rank.activeWeeksRemaining
		? t('nextWeeks', { count: rank.activeWeeksRemaining })
		: t('nextWeeksMet')
	return t('nextJoin', { sessions, weeks })
}
