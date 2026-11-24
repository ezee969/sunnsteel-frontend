import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { sitePageMetadata } from '@/features/site/pages/site-page'
import {
	USE_CASE_SLUGS,
	UseCasePage,
	type UseCaseSlug,
} from '@/features/site/pages/use-case-page'
import type { Locale } from '@/i18n/config'

/** SITE-01 §12.17-§12.18: the three use-case pages, built once per language. */
export const dynamicParams = false

export function generateStaticParams() {
	return USE_CASE_SLUGS.map(level => ({ level }))
}

type Params = { params: Promise<{ locale: string; level: string }> }

const isLevel = (level: string): level is UseCaseSlug =>
	(USE_CASE_SLUGS as readonly string[]).includes(level)

export async function generateMetadata({ params }: Params): Promise<Metadata> {
	const { locale, level } = await params
	if (!isLevel(level)) return {}
	const t = await getTranslations({
		locale: locale as Locale,
		namespace: `sitePages.useCases.${level}`,
	})
	return sitePageMetadata({
		title: t('meta.title'),
		description: t('meta.description'),
		path: `/use-cases/${level}`,
	})
}

export default async function UseCaseLevelPage({ params }: Params) {
	const { locale, level } = await params
	if (!isLevel(level)) notFound()
	setRequestLocale(locale as Locale)
	return <UseCasePage slug={level} locale={locale as Locale} />
}
