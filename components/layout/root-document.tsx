import type { Metadata, Viewport } from 'next'
import {
	Bebas_Neue,
	Cinzel,
	Oswald,
	Source_Sans_3,
	Space_Mono,
} from 'next/font/google'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { type Locale, LOCALES } from '@/i18n/config'
import { PUBLIC_ORIGIN } from '@/lib/config/env'
import { DISPLAY_PREFERENCE_SCRIPT } from '@/lib/utils/display-preference'
import { MOTION_PREFERENCE_SCRIPT } from '@/lib/utils/motion-preference'

/**
 * SITE-01: the document both root layouts render -- the app's
 * (app/[locale]/(app)/layout.tsx) and the public site's
 * (app/[locale]/(site)/layout.tsx). They are separate roots so each loads its
 * own stylesheet and providers, and Next makes a move between them a full
 * page load; what every page shares (fonts, the pre-paint scripts, the
 * metadata) lives here once. The providers are each root's own client
 * boundary (`AppRootProviders`, `SiteRootProviders`), passed as children:
 * see providers/root-shell.tsx for why this renders none itself.
 */

const oswald = Oswald({
	variable: '--font-oswald',
	subsets: ['latin'],
	weight: ['400', '500', '600', '700'],
	display: 'swap',
})

// UX-14 (design system §23): the body face. Oswald is a condensed display
// face, and set as running text it made every paragraph read cramped; it stays
// for item titles, labels and buttons. One variable file covers every weight
// the body uses, so no weight is ever synthesised.
const sourceSans = Source_Sans_3({
	variable: '--font-source-sans',
	subsets: ['latin'],
	display: 'swap',
})

const spaceMono = Space_Mono({
	variable: '--font-space-mono',
	subsets: ['latin'],
	weight: ['400', '700'],
	display: 'swap',
})

const bebasNeue = Bebas_Neue({
	variable: '--font-bebas-neue',
	subsets: ['latin'],
	weight: ['400'],
	display: 'swap',
})

// 600 is now the only weight used: the page and section inscriptions, and —
// since the 2026-09-17 wordmark re-cut — the wordmark too, which used to be the
// sole consumer of 900. It used to load six weights, then two (CL-07). Cinzel
// is referenced by literal family name from inline styles — that resolves,
// because next/font emits the @font-face with the real `Cinzel` family, not a
// hashed one. `--font-cinzel` is exposed but never referenced in CSS.
const cinzel = Cinzel({
	variable: '--font-cinzel',
	subsets: ['latin'],
	weight: ['600'],
	display: 'swap',
})

const FONT_VARIABLES = `${oswald.variable} ${sourceSans.variable} ${spaceMono.variable} ${bebasNeue.variable} ${cinzel.variable}`

/**
 * I18N-03: title, description and the OpenGraph alt text follow the language;
 * everything else (brand names, icons, keywords) is not product copy and
 * stays fixed. `openGraph.locale` is the BCP 47 tag the language actually
 * renders in, `en_US` or `es_ES` -- it read `es_ES` even for English before
 * this, which was never corrected until translation made it visible.
 */
export async function rootMetadata(locale: Locale): Promise<Metadata> {
	const t = await getTranslations({ locale, namespace: 'core.metadata' })
	const title = t('title')
	const description = t('description')

	return {
		title: {
			default: title,
			template: `%s | ${title}`,
		},
		description,
		keywords: [
			'fitness',
			'ejercicio',
			'entrenamiento',
			'salud',
			'bienestar',
			'rutinas',
			'gimnasio',
			'ejercicio en casa',
		],
		authors: [{ name: 'Sunnsteel Team' }],
		creator: 'Sunnsteel',
		publisher: 'Sunnsteel',
		metadataBase: new URL(PUBLIC_ORIGIN),
		alternates: {
			canonical: '/',
		},
		openGraph: {
			title,
			description,
			url: '/',
			siteName: 'Sunnsteel',
			images: [
				{
					url: '/og-image.png',
					width: 1200,
					height: 630,
					alt: t('ogAlt'),
				},
			],
			locale: locale === 'es' ? 'es_ES' : 'en_US',
			type: 'website',
		},
		icons: {
			icon: [
				{ url: '/favicon.ico', sizes: '48x48' },
				{ url: '/icon.svg', type: 'image/svg+xml' },
				{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
				{ url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
			],
			apple: [
				{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
			],
		},
		// iOS-installed PWA is the declared target platform, so the title and
		// status bar style are set explicitly rather than left to Safari's
		// defaults. `black-translucent` lets the app paint under the status bar,
		// which is what the full-bleed dark layout expects. See TD-20.
		appleWebApp: {
			capable: true,
			title: 'Sunnsteel',
			statusBarStyle: 'black-translucent',
		},
		manifest: '/site.webmanifest',
	}
}

export const ROOT_VIEWPORT: Viewport = {
	themeColor: [
		{ media: '(prefers-color-scheme: light)', color: '#ede9e1' },
		{ media: '(prefers-color-scheme: dark)', color: '#0f0c08' },
	],
	width: 'device-width',
	initialScale: 1,
}

// I18N-01: one static build of every page per language. The address never
// carries the language: middleware.ts rewrites `/dashboard` to
// `/<locale>/dashboard` from the `ss-locale` cookie, so the pages stay static
// and served from the CDN, and every link stays as it was.
export function rootStaticParams() {
	return LOCALES.map(locale => ({ locale }))
}

export function RootDocument({
	locale,
	children,
}: {
	locale: Locale
	children: ReactNode
}) {
	// `lang` is the page's language on the first byte, so screen readers
	// pronounce it right. It said "es" over English text until I18N-01.
	return (
		<html lang={locale} suppressHydrationWarning>
			{/* Rendered only by the two root layouts, where <head> belongs. */}
			{/* eslint-disable-next-line @next/next/no-head-element */}
			<head>
				{/* A11Y-01: apply the device's stored reduce-motion choice before the
				    first paint, the way next-themes applies the theme. */}
				<script
					dangerouslySetInnerHTML={{ __html: MOTION_PREFERENCE_SCRIPT }}
				/>
				{/* A11Y-02: the same for higher contrast and larger controls. */}
				<script
					dangerouslySetInnerHTML={{ __html: DISPLAY_PREFERENCE_SCRIPT }}
				/>
			</head>
			<body
				className={`${FONT_VARIABLES} antialiased`}
				suppressHydrationWarning
			>
				{children}
			</body>
		</html>
	)
}
