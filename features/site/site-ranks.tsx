import { renaissanceRankProgress } from '@sunsteel/contracts'
import { getTranslations } from 'next-intl/server'

import { rankText } from '@/i18n/catalog'
import { RANKS } from '@/lib/site/landing-examples'
import {
	formatNextRankRequirements,
	formatRankEvidence,
} from '@/lib/utils/achievements'

import { SiteSectionHeading } from './site-parts'
import { type SiteRank, SiteRanksStage } from './site-ranks-stage'

/**
 * SITE-01 §12.7: a rank is earned by showing up, and it dresses your
 * profile. The ladder is contracts' (names and descriptions the catalog's);
 * the phone shows the profile header as a member sees it, and under it the
 * dashboard's rank line (DASH-11) worded by the app's own formatters, for a
 * member standing exactly on each rank's requirement. The climb
 * (site-ranks-stage.tsx) rests on Artisan, the first framed tier.
 */
const HEADER_RANK = 'ARTISAN'

export async function SiteRanks() {
	const t = await getTranslations('site.ranks')
	const tRanks = await getTranslations('catalog.ranks')
	const tRank = await getTranslations('achievements.rank')
	const tDashboard = await getTranslations('planning.dashboardRank')
	const ranks: SiteRank[] = RANKS.map((rank, index) => {
		const text = rankText(rank, tRanks)
		const next = RANKS[index + 1] ?? null
		// A member exactly on this rank's requirement, through the app's rule.
		const progress = renaissanceRankProgress({
			completedSessions: rank.minimumSessions,
			activeWeeks: rank.minimumActiveWeeks,
			completedSets: rank.minimumCompletedSets,
		})
		const requirements = formatNextRankRequirements(progress, tRank)
		return {
			id: rank.id,
			title: text.title,
			description: text.description,
			requirement:
				rank.minimumSessions === 0
					? t('firstRank')
					: rank.minimumCompletedSets > 0
						? t('requirementSets', {
								workouts: rank.minimumSessions,
								weeks: rank.minimumActiveWeeks,
								sets: rank.minimumCompletedSets,
							})
						: t('requirement', {
								workouts: rank.minimumSessions,
								weeks: rank.minimumActiveWeeks,
							}),
			evidence: formatRankEvidence(progress, tRank),
			next:
				next && requirements
					? {
							id: next.id,
							label: tDashboard('next', {
								title: rankText(next, tRanks).title,
							}),
							requirements,
						}
					: null,
		}
	})

	return (
		<section aria-labelledby="ranks-heading" className="site-section">
			<SiteSectionHeading id="ranks-heading">{t('heading')}</SiteSectionHeading>
			<SiteRanksStage
				body={t('body', {
					count: ranks.length,
					first: ranks[0].title,
					last: ranks[ranks.length - 1].title,
				})}
				ladderLabel={t('ladderLabel')}
				ranks={ranks}
				restingRank={HEADER_RANK}
				labels={{ current: tRank('current'), highest: tRank('highest') }}
				header={{
					name: t('profileName'),
					handle: t('profileHandle'),
					initials: t('profileInitials'),
				}}
			/>
		</section>
	)
}
