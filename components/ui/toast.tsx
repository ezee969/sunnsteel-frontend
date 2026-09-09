'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import {
	createContext,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react'

import { cn } from '@/lib/utils'

export type ToastVariant =
	'default' | 'success' | 'destructive' | 'warning' | 'info'

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

/**
 * A toast is an overlay, so every variant sits on the same `--popover` surface
 * (§8 — one shadow, light only; dark separates by a 1px `--rule`). The variant
 * is carried by a `.mark` left rule plus a glyph, never by a tinted card:
 * §11.12 says status is a mark plus a glyph with no fill, and the five tinted
 * cards this replaced were five different surfaces for one component.
 *
 * `info` and `default` take no mark colour on purpose. The palette has no role
 * for "neutral information" — inventing one would be a sixth accent — so they
 * keep `.mark`'s transparent rule and are distinguished by their glyph, which
 * §4.3 rule 8 already requires of every state.
 */
const variantStyles: Record<
	ToastVariant,
	{ mark: string; icon: React.ReactNode }
> = {
	default: {
		mark: '',
		icon: <Info className="h-5 w-5 text-ink-3" aria-hidden />,
	},
	success: {
		mark: 'mark-success',
		icon: <CheckCircle2 className="h-5 w-5 text-success" aria-hidden />,
	},
	destructive: {
		mark: 'border-l-destructive',
		icon: <XCircle className="h-5 w-5 text-destructive" aria-hidden />,
	},
	warning: {
		mark: 'mark-warning',
		icon: <AlertCircle className="h-5 w-5 text-warning-strong" aria-hidden />,
	},
	info: {
		mark: '',
		icon: <Info className="h-5 w-5 text-ink-3" aria-hidden />,
	},
}

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([])
	const [mounted, setMounted] = useState(false)
	useEffect(() => {
		setMounted(true)
	}, [])

	const remove = useCallback((id: string) => {
		setToasts(t => t.filter(x => x.id !== id))
	}, [])

	const push = useCallback(
		(t: Omit<Toast, 'id'>) => {
			const id = crypto.randomUUID()
			const toast: Toast = { id, duration: 4000, variant: 'default', ...t }
			setToasts(list => [...list, toast])
			if (toast.duration && toast.duration > 0) {
				setTimeout(() => remove(id), toast.duration)
			}
		},
		[remove],
	)

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
						{toasts.map(t => (
							// §9.2 — no scale on enter or exit. Enter is
							// `--motion-base`; exit runs at 70% of it (§9).
							<motion.div
								key={t.id}
								layout
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, transition: { duration: 0.14 } }}
								transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
								className={cn(
									'group mark relative overflow-hidden rounded-md border border-rule bg-popover p-4 pl-4 text-popover-foreground shadow-overlay dark:shadow-none',
									variantStyles[t.variant || 'default'].mark,
								)}
							>
								<div className="flex gap-3">
									<div className="shrink-0 pt-0.5">
										{variantStyles[t.variant || 'default'].icon}
									</div>
									<div className="flex-1 min-w-0 pr-4">
										{t.title && (
											<p className="type-panel mb-1 text-foreground">
												{t.title}
											</p>
										)}
										{t.description && (
											<p className="type-body-sm text-ink-2">{t.description}</p>
										)}
									</div>
									{/* The `group` class this depends on was missing from the
									    container, so the dismiss control was permanently
									    `opacity-0` — invisible, but still clickable. */}
									<button
										onClick={() => remove(t.id)}
										aria-label="Dismiss notification"
										className="hover-reveal absolute top-3 right-3 rounded-sm p-1 text-ink-3 opacity-0 transition-opacity duration-[var(--motion-fast)] ease-standard group-hover:opacity-100 focus-visible:opacity-100 hover:text-foreground"
									>
										<X className="h-3.5 w-3.5" aria-hidden />
									</button>
								</div>

								{/* Auto-dismiss timer. It measures time, not status, so it
								    takes no semantic colour (§4.3 rule 8's converse). */}
								{t.duration && t.duration > 0 && (
									<motion.div
										initial={{ width: '100%' }}
										animate={{ width: '0%' }}
										transition={{ duration: t.duration / 1000, ease: 'linear' }}
										className="absolute bottom-0 left-0 h-[2px] bg-rule"
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
