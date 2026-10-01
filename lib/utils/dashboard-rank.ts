import type { AchievementsResponse } from '@sunsteel/contracts'

import { rankText } from '@/i18n/catalog'
import type { Translator } from '@/i18n/translator'

import { formatNextRankRequirements, formatRankEvidence } from './achievements'
import type { RenaissanceRankId } from './rank-identity'

/**
 * DASH-11. The member's rank leads the dashboard. It places what `ACH-02`
 * already computes and adds no calculation: the current rank with the
 * attendance that earned it, and the next rank with exactly what remains.
 * There are no percentages and no deadlines (`ACH-04`).
 */
export interface DashboardRank {
	rankId: RenaissanceRankId
	title: string
	/** Completed sessions and active weeks, as `/achievements` states them. */
	evidence: string
	/** Null once the ladder is finished. */
	next: {
		rankId: RenaissanceRankId
		title: string
		/** What remains for each requirement. */
		requirements: string
	} | null
}

export interface DashboardRankTranslators {
	rank: Translator<'achievements.rank'>
	catalogRanks: Translator<'catalog.ranks'>
}

/**
 * Every account holds Initiate from its first day (the ladder starts at zero
 * sessions), so there is no "no rank yet" state to invent. Until the analytics
 * projection is ready the rank is unknown, and the masthead shows nothing
 * rather than a rank it cannot vouch for.
 */
export function buildDashboardRank(
	t: DashboardRankTranslators,
	data?: AchievementsResponse,
): DashboardRank | null {
	if (!data?.analyticsReady || !data.rank) return null

	const { rank } = data
	const requirements = formatNextRankRequirements(rank, t.rank)

	return {
		rankId: rank.currentRank.id,
		title: rankText(rank.currentRank, t.catalogRanks).title,
		evidence: formatRankEvidence(rank, t.rank),
		next:
			rank.nextRank && requirements
				? {
						rankId: rank.nextRank.id,
						title: rankText(rank.nextRank, t.catalogRanks).title,
						requirements,
					}
				: null,
	}
}
