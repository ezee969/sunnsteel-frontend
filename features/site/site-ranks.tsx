import { getTranslations } from 'next-intl/server'

import { rankText } from '@/i18n/catalog'
import { RANKS } from '@/lib/site/landing-examples'

import { SiteSectionHeading } from './site-parts'
import { type SiteRank, SiteRanksStage } from './site-ranks-stage'

/**
 * SITE-01 §12.7: a rank is earned by showing up, and it dresses your
 * profile. The ladder is contracts' (names and descriptions the catalog's);
 * the header is the profile's own, in Artisan -- the first framed tier, and a
 * light one, where the climb (site-ranks-stage.tsx) rests.
 */
const HEADER_RANK = 'ARTISAN'

export async function SiteRanks() {
	const t = await getTranslations('site.ranks')
	const tRanks = await getTranslations('catalog.ranks')
	const tMock = await getTranslations('site.mock')
	const ranks: SiteRank[] = RANKS.map(rank => {
		const text = rankText(rank, tRanks)
		return {
			id: rank.id,
			title: text.title,
			description: text.description,
			requirement:
				rank.minimumSessions === 0
					? t('firstRank')
					: t('requirement', {
							workouts: rank.minimumSessions,
							weeks: rank.minimumActiveWeeks,
						}),
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
				header={{
					name: t('profileName'),
					handle: t('profileHandle'),
					initials: t('profileInitials'),
					example: tMock('example'),
				}}
			/>
		</section>
	)
}
