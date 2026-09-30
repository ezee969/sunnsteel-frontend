import type {
	AchievementsResponse,
	RenaissanceRankProgress,
} from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import type { Translator } from '@/i18n/translator'

import {
	achievementCategoryLabel,
	formatMilestoneProgressDetail,
	formatMilestoneProgressEvidence,
	formatNextRankRequirements,
	formatRankEvidence,
	orderMilestoneProgress,
} from './achievements'
import type { EmptyStateCopy } from './empty-states'
import type { RenaissanceRankId } from './rank-identity'

/**
 * DASH-09 places what `ACH-02` and `ACH-04` already compute and adds no
 * calculation of its own. It keeps the ACH-04 rules on the dashboard too:
 * exact values, the stable catalog order, and no percentages, deadlines or
 * ranking by what is closest.
 */
export interface UpcomingMilestone {
	key: string
	/** The ladder the milestone belongs to, as a row caption. */
	group: string
	title: string
	/** Exact current and target values. */
	evidence: string
	/** What remains, stated without a deadline. */
	detail: string
	/** The next rank's stable ID, so the row can draw its crest (ACH-09). */
	rankId?: RenaissanceRankId
}

/** The translators the rows are built from, one per message group. */
export interface MilestoneTranslators {
	categories: Translator<'achievements.categories'>
	progress: Translator<'achievements.progress'>
	rank: Translator<'achievements.rank'>
}

function buildRankMilestone(
	rank: RenaissanceRankProgress,
	t: MilestoneTranslators,
): UpcomingMilestone | null {
	const detail = formatNextRankRequirements(rank, t.rank)
	if (!rank.nextRank || !detail) return null
	return {
		key: 'RANK',
		group: t.rank('title'),
		title: rank.nextRank.title,
		rankId: rank.nextRank.id,
		evidence: formatRankEvidence(rank, t.rank),
		detail,
	}
}

/**
 * The next rank first, then one next milestone per category in catalog order.
 * A category whose five fixed milestones are all recorded has nothing upcoming
 * and is left out; `/achievements` remains the place that states it is done.
 */
export function buildUpcomingMilestones(
	locale: Locale,
	t: MilestoneTranslators,
	data?: AchievementsResponse,
): UpcomingMilestone[] {
	if (!data?.analyticsReady) return []

	const rank = data.rank ? buildRankMilestone(data.rank, t) : null
	const categories = orderMilestoneProgress(data.milestoneProgress ?? [])
		.filter(progress => progress.nextMilestone !== null)
		.map(progress => ({
			key: progress.category,
			group: achievementCategoryLabel(progress.category, t.categories),
			title: progress.nextMilestone?.title ?? '',
			evidence: formatMilestoneProgressEvidence(progress, locale, t.progress),
			detail: formatMilestoneProgressDetail(progress, locale, t.progress),
		}))

	return rank ? [rank, ...categories] : categories
}

/**
 * DASH-10's rule applies here too: an empty module names the next step. The
 * two empty cases are genuinely different — nothing verified yet, versus every
 * fixed milestone already recorded — so they must not share one sentence.
 */
export function getUpcomingMilestonesEmptyState(
	t: Translator<'planning.dashboardMilestones'>,
	data?: AchievementsResponse,
): EmptyStateCopy {
	if (!data?.analyticsReady) {
		return {
			title: t('noneTitle'),
			description: t('noneDescription'),
			action: { kind: 'link', label: t('browseRoutines'), href: '/routines' },
		}
	}

	const atFinalRank = Boolean(data.rank && !data.rank.nextRank)
	return {
		title: t('allTitle'),
		description: atFinalRank
			? t('allDescriptionFinalRank')
			: t('allDescription'),
		action: {
			kind: 'link',
			label: t('openAchievements'),
			href: '/achievements',
		},
	}
}
