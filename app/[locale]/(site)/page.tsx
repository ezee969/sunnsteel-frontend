import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { SiteHero } from '@/features/site/site-hero'
import { SiteProofBand } from '@/features/site/site-proof-band'
import { SiteTopBar } from '@/features/site/site-top-bar'
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
		<div className="site dark">
			<SiteTopBar />
			<main>
				<SiteHero />
				<SiteProofBand />
			</main>
		</div>
	)
}
