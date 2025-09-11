import type { Metadata } from 'next';
import { Geist, Geist_Mono, Cinzel } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/providers/app-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { PwaProvider } from '@/providers/pwa-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const cinzel = Cinzel({
  variable: '--font-cinzel',
  subsets: ['latin'],
});

import { Viewport } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Sunnsteel',
    template: '%s | Sunnsteel',
  },
  description:
    'Transforma tu rutina de ejercicios con Sunnsteel. Haz seguimiento de tus entrenamientos y logra tus metas fitness.',
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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'
  ),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Sunnsteel - Tu Viaje Fitness',
    description:
      'Transforma tu rutina de ejercicios con Sunnsteel. Haz seguimiento de tus entrenamientos y logra tus metas fitness.',
    url: '/',
    siteName: 'Sunnsteel',
    images: [
      {
        url: '/logo.png',
        width: 1024,
        height: 1024,
        alt: 'Sunnsteel - Plataforma Fitness',
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
};

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PwaProvider />
          <AppProvider>{children}</AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
