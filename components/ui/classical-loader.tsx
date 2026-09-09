'use client'

import { ClassicalIcon } from '@/components/icons/ClassicalIcon'
import { cn } from '@/lib/utils'

const SIZES = {
	sm: { box: 'h-8 w-8', ring: 'border-2', icon: 'h-3 w-3' },
	md: { box: 'h-14 w-14', ring: 'border-[3px]', icon: 'h-6 w-6' },
	lg: { box: 'h-20 w-20', ring: 'border-4', icon: 'h-9 w-9' },
} as const

export interface ClassicalLoaderProps {
	size?: keyof typeof SIZES
	className?: string
	/** Announced to screen readers in place of the visual animation. */
	label?: string
}

/**
 * An ink arc orbiting a breathing laurel wreath.
 *
 * It was gold, on the last two `rgba(218,165,32,…)` literals and the last
 * `--ss-gold` alias in the app. v1.0 §4.3 rule 3 reserves honour for "better
 * than planned" and says explicitly that it is never decoration, so a spinner
 * cannot wear it — the arc is `--foreground` and the wreath `--ink-3`, which
 * inverts correctly in both themes where the hardcoded rgba pair did not.
 *
 * Built only from Tailwind's stock `animate-spin` / `animate-pulse`. Custom
 * `@keyframes` in globals.css are not worth the risk here: Turbopack silently
 * served a truncated stylesheet once, which left the animation-name resolving
 * to keyframes that did not exist — a spinner that does not spin, with no error
 * anywhere. These two utilities ship with the framework and are already used
 * throughout the app.
 */
export function ClassicalLoader({
	size = 'md',
	className,
	label = 'Loading',
}: ClassicalLoaderProps) {
	const { box, ring, icon } = SIZES[size]

	return (
		<span
			role="status"
			aria-label={label}
			className={cn(
				'relative inline-flex shrink-0 items-center justify-center',
				box,
				className,
			)}
		>
			{/* Track */}
			<span
				aria-hidden
				className={cn('absolute inset-0 rounded-full border-rule-faint', ring)}
			/>
			{/* Orbiting arc */}
			<span
				aria-hidden
				className={cn(
					'absolute inset-0 animate-spin-slow rounded-full border-transparent border-t-ink-2',
					ring,
				)}
			/>
			<ClassicalIcon
				name="laurel-wreath"
				aria-hidden
				className={cn('animate-pulse-opacity text-ink-3', icon)}
			/>
		</span>
	)
}

export default ClassicalLoader
