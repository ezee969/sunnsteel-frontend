import '../../site.css'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import type { ReactNode } from 'react'

import {
	ROOT_VIEWPORT,
	RootDocument,
	rootMetadata,
	rootStaticParams,
} from '@/components/layout/root-document'
import { type Locale, LOCALES } from '@/i18n/config'
import { type Messages, siteMessages } from '@/messages'
import { IntlProvider } from '@/providers/intl-provider'

/**
 * SITE-01: the public site's own root layout, beside the app's
 * (`(app)/layout.tsx`). It loads only the site's stylesheet (app/site.css),
 * hands the browser only the messages its client components read
 * (`siteMessages`) and none of the app's providers, and because it is a
 * separate root, Next makes a move into the app (Login, Sign up) a full page
 * load, so the two stylesheets never meet in one document.
 */
export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>
}): Promise<Metadata> {
	return rootMetadata((await params).locale as Locale)
}

export const viewport = ROOT_VIEWPORT

export const generateStaticParams = rootStaticParams

export const dynamicParams = false

export default async function SiteRootLayout({
	children,
	params,
}: {
	children: ReactNode
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	if (!hasLocale(LOCALES, locale)) notFound()
	setRequestLocale(locale)
	const messages = (await getMessages({ locale })) as Messages
	return (
		<RootDocument locale={locale}>
			<IntlProvider locale={locale} messages={siteMessages(messages)}>
				{children}
			</IntlProvider>
		</RootDocument>
	)
}
