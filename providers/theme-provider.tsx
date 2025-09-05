'use client'

import React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export type NextThemesProviderProps = React.ComponentProps<typeof NextThemesProvider>

export function ThemeProvider({ children, ...props }: NextThemesProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
