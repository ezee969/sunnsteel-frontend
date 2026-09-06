'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import React from 'react'

export type NextThemesProviderProps = React.ComponentProps<
	typeof NextThemesProvider
>

export function ThemeProvider({ children, ...props }: NextThemesProviderProps) {
	return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
