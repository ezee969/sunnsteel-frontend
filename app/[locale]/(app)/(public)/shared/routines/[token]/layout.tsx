import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import type { Locale } from '@/i18n/config'

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>
}): Promise<Metadata> {
	const { locale } = await params
	const t = await getTranslations({
		locale: locale as Locale,
		namespace: 'core.sharedRoutineMeta',
	})
	return {
		title: t('title'),
		description: t('description'),
		// A share link is meant for the people it was sent to, not for search.
		robots: { index: false, follow: false },
	}
}

export default function SharedRoutineLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return children
}
