import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { RouteError } from '@/components/layout/RouteError'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/config'

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>
}): Promise<Metadata> {
	const { locale } = await params
	const t = await getTranslations({
		locale: locale as Locale,
		namespace: 'core.offline',
	})
	return {
		title: t('metaTitle'),
		robots: { index: false },
	}
}

/**
 * TD-44: the page the service worker serves for a navigation that is neither
 * online nor in its page cache. It is static and precached at build time, so
 * it renders with no network at all. Pages already visited still come from
 * the cache first; this is only for the rest.
 */
export default async function OfflinePage() {
	const t = await getTranslations('core.offline')

	return (
		<main className="ledger-page py-10 md:py-16">
			<RouteError title={t('title')} description={t('description')}>
				<Button asChild>
					<Link href="/dashboard">{t('cta')}</Link>
				</Button>
			</RouteError>
		</main>
	)
}
