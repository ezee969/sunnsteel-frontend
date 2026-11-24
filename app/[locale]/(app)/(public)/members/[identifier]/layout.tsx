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
		namespace: 'core.memberProfileMeta',
	})
	return {
		title: t('title'),
		description: t('description'),
	}
}

export default function SharedProfileLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return children
}
