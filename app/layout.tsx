import './globals.css'

import type { Metadata } from 'next'
import { Bebas_Neue, Cinzel, Oswald, Space_Mono } from 'next/font/google'

import DevInjections from '@/components/dev-injections'
import { PUBLIC_ENV, SHOULD_SHOW_PERFORMANCE_PANEL } from '@/lib/config/env'
import { AppProvider } from '@/providers/app-provider'
import { PwaProvider } from '@/providers/pwa-provider'
import { ThemeProvider } from '@/providers/theme-provider'

const oswald = Oswald({
	variable: '--font-oswald',
	subsets: ['latin'],
	weight: ['400', '500', '600', '700'],
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

// Only 600 and 900 are actually used: 900 for the two SUNNSTEEL wordmarks
// (Sidebar and the mobile splash) and 600 for the splash tagline and loading
// text. It used to load six weights. Cinzel is referenced by literal family
// name from inline styles — that resolves, because next/font emits the
// @font-face with the real `Cinzel` family, not a hashed one. `--font-cinzel`
// is exposed but never referenced in CSS. See CL-07.
const cinzel = Cinzel({
	variable: '--font-cinzel',
	subsets: ['latin'],
	weight: ['600', '900'],
	display: 'swap',
})

import { Viewport } from 'next'

// Client-only dev helpers are rendered via DevInjections

const SHOW_PERF_PANEL = SHOULD_SHOW_PERFORMANCE_PANEL

export const metadata: Metadata = {
	title: {
		default: 'SUNNSTEEL',
		template: '%s | Sunnsteel',
	},
	description: 'More than a routine logbook.',
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
	creator: 'SUNNSTEEL',
	publisher: 'Sunnsteel',
	metadataBase: new URL(PUBLIC_ENV.FRONTEND_URL),
	alternates: {
		canonical: '/',
	},
	openGraph: {
		title: 'SUNNSTEEL',
		description: 'More than a routine logbook.',
		url: '/',
		siteName: 'SUNNSTEEL',
		images: [
			{
				url: '/og-image.jpg',
				width: 1200,
				height: 630,
				alt: 'Sunnsteel - More than a routine logbook.',
			},
		],
		locale: 'es_ES',
		type: 'website',
	},
	icons: {
		icon: [
			{ url: '/favicon.ico' },
			{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
			{ url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
		],
		apple: [
			{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
		],
	},
	// iOS-installed PWA is the declared target platform, so the title and status
	// bar style are set explicitly rather than left to Safari's defaults.
	// `black-translucent` lets the app paint under the status bar, which is what
	// the full-bleed dark layout expects. See TD-20.
	appleWebApp: {
		capable: true,
		title: 'Sunnsteel',
		statusBarStyle: 'black-translucent',
	},
	manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
	themeColor: [
		{ media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
		{ media: '(prefers-color-scheme: dark)', color: '#000000' },
	],
	width: 'device-width',
	initialScale: 1,
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="es" suppressHydrationWarning>
			<body
				className={`${oswald.variable} ${spaceMono.variable} ${bebasNeue.variable} ${cinzel.variable} antialiased`}
				suppressHydrationWarning
			>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					<PwaProvider />
					<AppProvider>{children}</AppProvider>
					<DevInjections showPerfPanel={SHOW_PERF_PANEL} />
				</ThemeProvider>
			</body>
		</html>
	)
}
