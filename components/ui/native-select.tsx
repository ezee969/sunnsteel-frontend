import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * A native `<select>` with the same resting boundary as the `Input` primitive
 * (§11.6): 1px `--rule` on a `--surface` fill in both themes, 44px tall below
 * `md` and 40px above, with 16px text below `md` — the iOS zoom-on-focus
 * mitigation (§2.4), which a 14px select would reintroduce on exactly the
 * control most likely to be tapped first.
 *
 * Native rather than Radix `Select` where a plain choice list is enough: it
 * keeps the platform picker on phones and needs no portal.
 */
function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
	return (
		<select
			data-slot="native-select"
			className={cn(
				'h-11 w-full rounded-sm border border-rule bg-surface px-3 text-base outline-none transition-colors duration-[var(--motion-fast)] ease-standard focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 md:h-10 md:text-sm',
				'disabled:cursor-not-allowed disabled:bg-surface-sunk disabled:text-ink-3',
				className,
			)}
			{...props}
		/>
	)
}

export { NativeSelect }
