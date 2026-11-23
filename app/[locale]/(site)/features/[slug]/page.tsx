import { ACHIEVEMENT_DEFINITIONS } from '@sunsteel/contracts'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import {
	FEATURE_KEY,
	FEATURE_SLUGS,
	FeaturePage,
	type FeatureSlug,
} from '@/features/site/pages/feature-page'
import { sitePageMetadata } from '@/features/site/pages/site-page'
import type { Locale } from '@/i18n/config'
import { RANKS } from '@/lib/site/landing-examples'

/** SITE-01 §12.15-§12.16: the six feature pages, built once per language. */
export const dynamicParams = false

export function generateStaticParams() {
	return FEATURE_SLUGS.map(slug => ({ slug }))
}

type Params = { params: Promise<{ locale: string; slug: string }> }

const isSlug = (slug: string): slug is FeatureSlug =>
	(FEATURE_SLUGS as readonly string[]).includes(slug)

export async function generateMetadata({ params }: Params): Promise<Metadata> {
	const { locale, slug } = await params
	if (!isSlug(slug)) return {}
	const t = await getTranslations({
		locale: locale as Locale,
		namespace: `sitePages.features.${FEATURE_KEY[slug]}`,
	})
	return sitePageMetadata({
		title: t('meta.title'),
		description: t('meta.description', {
			ranks: RANKS.length,
			milestones: ACHIEVEMENT_DEFINITIONS.length,
		}),
		path: `/features/${slug}`,
	})
}

export default async function FeatureSlugPage({ params }: Params) {
	const { locale, slug } = await params
	if (!isSlug(slug)) notFound()
	setRequestLocale(locale as Locale)
	return <FeaturePage slug={slug} locale={locale as Locale} />
}
