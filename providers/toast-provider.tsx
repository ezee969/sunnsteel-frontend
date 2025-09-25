"use client"
import { ReactNode } from 'react'
import { ToastProvider } from '@/components/ui/toast'

export function AppToastProvider({ children }: { children: ReactNode }) {
	return <ToastProvider>{children}</ToastProvider>
}
