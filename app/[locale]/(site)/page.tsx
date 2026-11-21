import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { SiteHero } from '@/features/site/site-hero'
import { SitePeople } from '@/features/site/site-people'
import { SiteProgress } from '@/features/site/site-progress'
import { SiteProofBand } from '@/features/site/site-proof-band'
import { SiteRanks } from '@/features/site/site-ranks'
import { SiteTemplates } from '@/features/site/site-templates'
import { SiteTools } from '@/features/site/site-tools'
import { SiteTopBar } from '@/features/site/site-top-bar'
import { SiteVerbs } from '@/features/site/site-verbs'
import type { Locale } from '@/i18n/config'
import { siteLandingLive } from '@/lib/site/landing'

/**
 * SITE-01: the landing at `/` for a signed-out visitor (the middleware decides
 * who reaches it, `lib/site/landing.ts`). It is built in phases; until it is
 * finished it is reached only by preview and is kept out of search.
 */
export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>
}): Promise<Metadata> {
	const { locale } = await params
	const t = await getTranslations({
		locale: locale as Locale,
		namespace: 'site.meta',
	})
	return {
		title: { absolute: t('title') },
		description: t('description'),
		robots: siteLandingLive() ? undefined : { index: false, follow: false },
	}
}

export default async function LandingPage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	setRequestLocale(locale as Locale)
	return (
		<div className="site">
			<SiteTopBar />
			<main>
				{/* §33.2: the hero and its proof band are a Night region in both
				    themes; from the four verbs on, the page follows the visitor's. */}
				<div className="dark site-night" data-region="night">
					<SiteHero />
					<SiteProofBand />
				</div>
				<SiteVerbs />
				<SiteTools />
				<SiteProgress />
				<SiteRanks />
				<SiteTemplates />
				<SitePeople />
			</main>
		</div>
	)
}
