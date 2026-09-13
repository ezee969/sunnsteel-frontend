'use client'

import React from 'react'

import { cn } from '@/lib/utils'

interface TopLoadingBarProps {
	show: boolean
	className?: string
}

/**
 * An indeterminate loading bar. Ink on a square track, pulsing with the motion
 * spec's `pulse-opacity` (§4: its keyframe inventory is closed). It used to be
 * a gold hex gradient sliding on a keyframe of its own.
 */
export const TopLoadingBar: React.FC<TopLoadingBarProps> = ({
	show,
	className,
}) => {
	if (!show) return null

	return (
		<div
			className={cn(
				'absolute left-0 right-0 top-0 h-0.5 overflow-hidden',
				className,
			)}
			role="status"
			aria-live="polite"
		>
			<div className="animate-pulse-opacity h-full w-full bg-primary" />
		</div>
	)
}
