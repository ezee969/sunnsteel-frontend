import type { AchievementsResponse } from '@sunsteel/contracts'

import { achievementText } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import type { Translator } from '@/i18n/translator'

import {
	achievementCategoryLabel,
	formatMilestoneProgressDetail,
	formatMilestoneProgressEvidence,
	orderMilestoneProgress,
} from './achievements'
import type { EmptyStateCopy } from './empty-states'

/**
 * DASH-09 places what `ACH-04` already computes and adds no calculation of its
 * own. It keeps the ACH-04 rules on the dashboard too: exact values, the
 * stable catalog order, and no percentages, deadlines or ranking by what is
 * closest. The next rank lives in the dashboard masthead since `DASH-11`, so
 * it is not repeated here.
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
}

/** The translators the rows are built from, one per message group. */
export interface MilestoneTranslators {
	categories: Translator<'achievements.categories'>
	progress: Translator<'achievements.progress'>
	catalogAchievements: Translator<'catalog.achievements'>
}

/**
 * One next milestone per category in catalog order. A category whose five
 * fixed milestones are all recorded has nothing upcoming and is left out;
 * `/achievements` remains the place that states it is done.
 */
export function buildUpcomingMilestones(
	locale: Locale,
	t: MilestoneTranslators,
	data?: AchievementsResponse,
): UpcomingMilestone[] {
	if (!data?.analyticsReady) return []

	return orderMilestoneProgress(data.milestoneProgress ?? [])
		.filter(progress => progress.nextMilestone !== null)
		.map(progress => ({
			key: progress.category,
			group: achievementCategoryLabel(progress.category, t.categories),
			title: progress.nextMilestone
				? achievementText(progress.nextMilestone, t.catalogAchievements).title
				: '',
			evidence: formatMilestoneProgressEvidence(progress, locale, t.progress),
			detail: formatMilestoneProgressDetail(progress, locale, t.progress),
		}))
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

	return {
		title: t('allTitle'),
		description: t('allDescription'),
		action: {
			kind: 'link',
			label: t('openAchievements'),
			href: '/achievements',
		},
	}
}
