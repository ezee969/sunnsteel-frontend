"use client"
import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { cn } from '@/lib/utils'

export type Toast = {
	id: string
	title?: string
	description?: string
	variant?: 'default' | 'destructive'
	duration?: number
}

type ToastContextValue = {
	toasts: Toast[]
	push: (t: Omit<Toast, 'id'>) => void
	remove: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([])
	const [mounted, setMounted] = useState(false)
	useEffect(() => { setMounted(true) }, [])

	const remove = useCallback((id: string) => {
		setToasts((t) => t.filter((x) => x.id !== id))
	}, [])

	const push = useCallback((t: Omit<Toast, 'id'>) => {
		const id = crypto.randomUUID()
		const toast: Toast = { id, duration: 4000, variant: 'default', ...t }
		setToasts((list) => [...list, toast])
		if (toast.duration && toast.duration > 0) {
			setTimeout(() => remove(id), toast.duration)
		}
	}, [remove])

	return (
		<ToastContext.Provider value={{ toasts, push, remove }}>
			{children}
			{mounted && (
				<div
					className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2"
					aria-live="polite"
					aria-relevant="additions removals"
					aria-label="Notifications"
					suppressHydrationWarning
				>
					{toasts.map((t) => (
						<div
							key={t.id}
							role="alert"
							aria-atomic="true"
							className={cn(
								'rounded-md border px-4 py-3 shadow-sm bg-background/95 backdrop-blur-sm text-sm',
								t.variant === 'destructive' && 'border-destructive text-destructive'
							)}
						>
							{t.title && <p className="font-medium mb-1">{t.title}</p>}
							{t.description && <p className="text-muted-foreground" >{t.description}</p>}
						</div>
					))}
				</div>
			)}
		</ToastContext.Provider>
	)
}

export function useToast() {
	const ctx = useContext(ToastContext)
	if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
	return ctx
}
