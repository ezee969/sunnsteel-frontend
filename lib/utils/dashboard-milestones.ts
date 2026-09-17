import type {
	AchievementsResponse,
	RenaissanceRankProgress,
} from '@sunsteel/contracts'

import {
	ACHIEVEMENT_CATEGORY_LABELS,
	formatMilestoneProgressDetail,
	formatMilestoneProgressEvidence,
	formatNextRankRequirements,
	formatRankEvidence,
	orderMilestoneProgress,
} from './achievements'
import type { EmptyStateCopy } from './empty-states'

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
}

function buildRankMilestone(
	rank: RenaissanceRankProgress,
): UpcomingMilestone | null {
	const detail = formatNextRankRequirements(rank)
	if (!rank.nextRank || !detail) return null
	return {
		key: 'RANK',
		group: 'Renaissance rank',
		title: rank.nextRank.title,
		evidence: formatRankEvidence(rank),
		detail,
	}
}

/**
 * The next rank first, then one next milestone per category in catalog order.
 * A category whose five fixed milestones are all recorded has nothing upcoming
 * and is left out; `/achievements` remains the place that states it is done.
 */
export function buildUpcomingMilestones(
	data?: AchievementsResponse,
): UpcomingMilestone[] {
	if (!data?.analyticsReady) return []

	const rank = data.rank ? buildRankMilestone(data.rank) : null
	const categories = orderMilestoneProgress(data.milestoneProgress ?? [])
		.filter(progress => progress.nextMilestone !== null)
		.map(progress => ({
			key: progress.category,
			group: ACHIEVEMENT_CATEGORY_LABELS[progress.category],
			title: progress.nextMilestone?.title ?? '',
			evidence: formatMilestoneProgressEvidence(progress),
			detail: formatMilestoneProgressDetail(progress),
		}))

	return rank ? [rank, ...categories] : categories
}

/**
 * DASH-10's rule applies here too: an empty module names the next step. The
 * two empty cases are genuinely different — nothing verified yet, versus every
 * fixed milestone already recorded — so they must not share one sentence.
 */
export function getUpcomingMilestonesEmptyState(
	data?: AchievementsResponse,
): EmptyStateCopy {
	if (!data?.analyticsReady) {
		return {
			title: 'No milestones yet',
			description:
				'Finish a workout and the next milestone in each category appears here with its exact target.',
			action: { kind: 'link', label: 'Browse routines', href: '/routines' },
		}
	}

	const atFinalRank = Boolean(data.rank && !data.rank.nextRank)
	return {
		title: 'Every fixed milestone is recorded',
		description: atFinalRank
			? 'The catalog in each category is complete and the Renaissance rank path is finished.'
			: 'The catalog in each category is complete.',
		action: { kind: 'link', label: 'Open achievements', href: '/achievements' },
	}
}
