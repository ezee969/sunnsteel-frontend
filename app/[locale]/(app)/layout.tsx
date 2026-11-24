import '../../globals.css'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'

import {
	ROOT_VIEWPORT,
	RootDocument,
	rootMetadata,
	rootStaticParams,
} from '@/components/layout/root-document'
import { type Locale, LOCALES } from '@/i18n/config'
import { type Messages, rootMessages } from '@/messages'
import { AppRootProviders } from '@/providers/app-root-providers'

/**
 * The app's root layout: every page but the public site's, which has a root
 * of its own (`(site)/layout.tsx`, SITE-01). Each route group below adds the
 * message areas it reads (`AppMessages`); this hands the browser `core`.
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

export default async function AppRootLayout({
	children,
	params,
}: Readonly<{
	children: React.ReactNode
	params: Promise<{ locale: string }>
}>) {
	const { locale } = await params
	if (!hasLocale(LOCALES, locale)) notFound()
	// Lets next-intl read the language from the segment rather than from the
	// request, which is what keeps the page static.
	setRequestLocale(locale)
	// The language is passed rather than read back from the request, so a
	// dynamically rendered page cannot fall back to English.
	const messages = (await getMessages({ locale })) as Messages
	return (
		<RootDocument locale={locale}>
			<AppRootProviders locale={locale} messages={rootMessages(messages)}>
				{children}
			</AppRootProviders>
		</RootDocument>
	)
}
