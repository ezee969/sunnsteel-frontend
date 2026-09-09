'use client'

import * as ProgressPrimitive from '@radix-ui/react-progress'
import * as React from 'react'

import { cn } from '@/lib/utils'

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root>

/**
 * A square progress track.
 *
 * The `gold` variant is retired with the last of the `--ss-*` aliases (v1.0
 * §11.3): its gradient fill broke §4.3 rule 6, and gold marked ordinary
 * progress rather than something earned (rule 3). Its only consumer was the
 * dashboard stat tile, converted in the same batch.
 *
 * The track is a well and the bar is square — nothing in this direction is a
 * pill (§7). Call sites re-colour the indicator through the
 * `[&_[data-slot=progress-indicator]]` hook.
 */
function Progress({ className, value, ...props }: ProgressProps) {
	return (
		<ProgressPrimitive.Root
			data-slot="progress"
			className={cn(
				'relative h-2 w-full overflow-hidden rounded-none bg-surface-sunk',
				className,
			)}
			{...props}
		>
			<ProgressPrimitive.Indicator
				data-slot="progress-indicator"
				className="h-full w-full flex-1 bg-primary transition-transform duration-[var(--motion-slow)] ease-standard"
				style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
			/>
		</ProgressPrimitive.Root>
	)
}

export { Progress }
