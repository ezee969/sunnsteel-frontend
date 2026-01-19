import type { Metadata } from 'next'
import { Oswald, Space_Mono, Bebas_Neue, Cinzel } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/providers/app-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import { PwaProvider } from '@/providers/pwa-provider'
import DevInjections from '@/components/dev-injections'

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

const cinzel = Cinzel({
	variable: '--font-cinzel',
	subsets: ['latin'],
	weight: ['400', '500', '600', '700', '800', '900'],
	display: 'swap',
})

import { Viewport } from 'next'

// Client-only dev helpers are rendered via DevInjections

const SHOW_PERF_PANEL =
	process.env.NODE_ENV === 'development' &&
	process.env.NEXT_PUBLIC_SHOW_PERFORMANCE_PANEL === 'true'

const ENABLE_ERUDA = process.env.NEXT_PUBLIC_ENABLE_ERUDA === 'true'

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
	metadataBase: new URL(
		process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
	),
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
				url: '/logo.png',
				width: 1024,
				height: 1024,
				alt: 'Sunnsteel - More than a routine logbook.',
			},
		],
		locale: 'es_ES',
		type: 'website',
	},
	icons: {
		icon: [
			{ url: '/favicon.ico' },
			{ url: '/logo.png', sizes: '192x192', type: 'image/png' },
			{ url: '/logo.png', sizes: '512x512', type: 'image/png' },
		],
		apple: [{ url: '/logo.png', sizes: '180x180', type: 'image/png' }],
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
			>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					<PwaProvider />
					<AppProvider>{children}</AppProvider>
					<DevInjections
						showPerfPanel={SHOW_PERF_PANEL}
						enableEruda={ENABLE_ERUDA}
					/>
				</ThemeProvider>
			</body>
		</html>
	)
}
