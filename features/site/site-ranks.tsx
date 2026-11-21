import { getTranslations } from 'next-intl/server'

import { RankCrest } from '@/features/achievements/rank-crest'
import { rankText } from '@/i18n/catalog'
import { RANKS } from '@/lib/site/landing-examples'

import { SiteSectionHeading } from './site-parts'
import { SiteRankHeader } from './site-rank-header'

/**
 * SITE-01 §12.7: a rank is earned by showing up, and it dresses your
 * profile. The ladder is contracts' (names and descriptions the catalog's);
 * the header is the profile's own, in Artisan -- the first framed tier, and a
 * light one. This is the phone layout every width shows until the motion
 * phase adds the desktop climb.
 */
const HEADER_RANK = 'ARTISAN'

export async function SiteRanks() {
	const t = await getTranslations('site.ranks')
	const tRanks = await getTranslations('catalog.ranks')
	const tMock = await getTranslations('site.mock')
	const names = RANKS.map(rank => rankText(rank, tRanks))
	const header = RANKS.find(rank => rank.id === HEADER_RANK) ?? RANKS[0]
	const headerText = rankText(header, tRanks)

	return (
		<section aria-labelledby="ranks-heading" className="site-section">
			<SiteSectionHeading id="ranks-heading">{t('heading')}</SiteSectionHeading>
			<div className="site-ranks">
				<div className="site-ranks-text">
					<p className="type-site-lead site-body">
						{t('body', {
							count: RANKS.length,
							first: names[0].title,
							last: names[names.length - 1].title,
						})}
					</p>
					<ol aria-label={t('ladderLabel')} className="site-ladder">
						{RANKS.map((rank, index) => (
							<li key={rank.id} className="site-ladder-rung">
								<RankCrest rankId={rank.id} className="size-9 shrink-0" />
								<div className="min-w-0">
									<p className="type-panel">{names[index].title}</p>
									<p className="type-body-sm text-ink-2">
										{rank.minimumSessions === 0
											? t('firstRank')
											: t('requirement', {
													workouts: rank.minimumSessions,
													weeks: rank.minimumActiveWeeks,
												})}
									</p>
								</div>
							</li>
						))}
					</ol>
				</div>
				<div className="site-ranks-header">
					<SiteRankHeader
						rankId={header.id}
						rankName={headerText.title}
						rankDescription={headerText.description}
						name={t('profileName')}
						handle={t('profileHandle')}
						initials={t('profileInitials')}
						example={tMock('example')}
					/>
				</div>
			</div>
		</section>
	)
}
