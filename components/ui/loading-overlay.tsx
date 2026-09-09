'use client'

import React from 'react'

import { ClassicalLoader } from '@/components/ui/classical-loader'
import { cn } from '@/lib/utils'

interface LoadingOverlayProps {
	show: boolean
	message?: string
	className?: string
}

/**
 * The blocking overlay shown while an auth action completes.
 *
 * It was the last place in the app holding hardcoded gold hexes (`#FFD700`,
 * `#B8860B`) and an inverted `black/40` → `white/40` scrim that made the dark
 * theme flash white. v1.0: `--scrim` behind, a `panel` in front (§11.5), and the
 * app's own loader rather than a second bespoke spinner — §4.3 rule 3 keeps gold
 * off decoration, which is why `ClassicalLoader` is ink now too.
 *
 * The gradient card, the blur and the `shadow-xl` all go: §8 has one shadow and
 * it belongs to overlays in light mode only.
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
	show,
	message = 'Signing you in...',
	className,
}) => {
	if (!show) return null

	return (
		<div
			className={cn(
				'absolute inset-0 z-50 flex items-center justify-center bg-scrim',
				className,
			)}
			aria-live="polite"
			role="status"
		>
			<div className="flex flex-col items-center gap-4 rounded-md border border-rule bg-popover px-6 py-5 shadow-overlay dark:shadow-none">
				<ClassicalLoader size="md" label={message} />
				<p className="type-body-sm text-ink-2">{message}</p>
			</div>
		</div>
	)
}
