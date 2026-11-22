import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { SiteClosing } from '@/features/site/site-closing'
import { SiteFooter } from '@/features/site/site-footer'
import { SiteHero } from '@/features/site/site-hero'
import {
	INSTALL_PROMPT_SCRIPT,
	SiteInstallHelper,
} from '@/features/site/site-install-helper'
import { SiteMotion } from '@/features/site/site-motion'
import { SitePeople } from '@/features/site/site-people'
import { SitePlans } from '@/features/site/site-plans'
import { SiteProgress } from '@/features/site/site-progress'
import { SiteProofBand } from '@/features/site/site-proof-band'
import { SiteQuestions } from '@/features/site/site-questions'
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
					{/* §12.12: the QR code's `?install=1` helper, on phones only; the
					    browser's install offer is caught before React runs. */}
					<script dangerouslySetInnerHTML={{ __html: INSTALL_PROMPT_SCRIPT }} />
					<SiteInstallHelper />
					<SiteHero />
					<SiteProofBand />
				</div>
				<SiteVerbs />
				<SiteTools />
				<SiteProgress />
				<SiteRanks />
				<SiteTemplates />
				<SitePeople />
				<SitePlans />
				<SiteQuestions />
				<SiteClosing />
			</main>
			<SiteFooter />
			<SiteMotion />
		</div>
	)
}
