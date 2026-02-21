"use client"
import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react'

export type ToastVariant = 'default' | 'success' | 'destructive' | 'warning' | 'info'

export type Toast = {
	id: string
	title?: string
	description?: string
	variant?: ToastVariant
	duration?: number
}

type ToastContextValue = {
	toasts: Toast[]
	push: (t: Omit<Toast, 'id'>) => void
	remove: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const variantStyles: Record<ToastVariant, { container: string; icon: React.ReactNode }> = {
	default: {
		container: 'border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80',
		icon: <Info className="h-5 w-5 text-neutral-500" />,
	},
	success: {
		container: 'border-emerald-500/20 bg-emerald-50/90 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100',
		icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
	},
	destructive: {
		container: 'border-red-500/20 bg-red-50/90 dark:bg-red-950/30 text-red-900 dark:text-red-100',
		icon: <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
	},
	warning: {
		container: 'border-amber-500/20 bg-amber-50/90 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100',
		icon: <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
	},
	info: {
		container: 'border-sky-500/20 bg-sky-50/90 dark:bg-sky-950/30 text-sky-900 dark:text-sky-100',
		icon: <Info className="h-5 w-5 text-sky-600 dark:text-sky-400" />,
	},
}

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
					className="fixed bottom-4 right-4 z-[9999] flex w-80 flex-col gap-3"
					aria-live="polite"
					aria-relevant="additions removals"
					aria-label="Notifications"
				>
					<AnimatePresence mode="popLayout">
						{toasts.map((t) => (
							<motion.div
								key={t.id}
								layout
								initial={{ opacity: 0, y: 20, scale: 0.95 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
								className={cn(
									'relative overflow-hidden rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all pl-5',
									variantStyles[t.variant || 'default'].container
								)}
							>
								{/* Side Accent bar */}
								<div className={cn(
									"absolute left-0 top-0 bottom-0 w-1",
									t.variant === 'success' && "bg-emerald-500",
									t.variant === 'destructive' && "bg-red-500",
									t.variant === 'warning' && "bg-amber-500",
									t.variant === 'info' && "bg-sky-500",
									(!t.variant || t.variant === 'default') && "bg-neutral-400"
								)} />

								<div className="flex gap-3">
									<div className="shrink-0 pt-0.5">
										{variantStyles[t.variant || 'default'].icon}
									</div>
									<div className="flex-1 min-w-0 pr-4">
										{t.title && <p className="font-semibold text-[15px] leading-tight mb-1">{t.title}</p>}
										{t.description && <p className="text-sm opacity-90 leading-relaxed" >{t.description}</p>}
									</div>
									<button 
										onClick={() => remove(t.id)}
										className="absolute top-3 right-3 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-neutral-400"
									>
										<X className="h-3.5 w-3.5" />
									</button>
								</div>
								
								{/* Bottom progress bar for auto-dismiss */}
								{t.duration && t.duration > 0 && (
									<motion.div 
										initial={{ width: '100%' }}
										animate={{ width: '0%' }}
										transition={{ duration: t.duration / 1000, ease: 'linear' }}
										className={cn(
											"absolute bottom-0 left-0 h-[2px] opacity-30",
											t.variant === 'destructive' ? 'bg-red-500' : 
											t.variant === 'success' ? 'bg-emerald-500' : 
											'bg-amber-500'
										)}
									/>
								)}
							</motion.div>
						))}
					</AnimatePresence>
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
