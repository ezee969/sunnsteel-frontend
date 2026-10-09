import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * UX-25 (design system §28.2): one look for every in-page choice -- a view,
 * a range, a filter. A toggle is not a command, so it never takes a button's
 * fill: it is §21.3's tab, Button type in `--ink-2` on a rule, the chosen
 * option `--foreground` over a 2px ink underline.
 *
 * `ToggleRow` is the labelled group; give it `aria-label` or
 * `aria-labelledby`. A row of one-of-several options and a row of independent
 * filters look the same: each option says whether it is on through
 * `aria-pressed`.
 */
function ToggleRow({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			role="group"
			data-slot="toggle-row"
			className={cn(
				'flex flex-wrap items-end gap-x-1 border-b border-rule',
				className,
			)}
			{...props}
		/>
	)
}

interface ToggleOptionProps extends Omit<
	React.ComponentProps<'button'>,
	'type' | 'aria-pressed'
> {
	pressed: boolean
}

function ToggleOption({ pressed, className, ...props }: ToggleOptionProps) {
	return (
		<button
			type="button"
			data-slot="toggle-option"
			aria-pressed={pressed}
			className={cn(
				// §21.3: hover changes colour only; 44px below `md`, 40 from it, and
				// gym mode's 48 wherever larger controls are on (§22.3). The
				// underline sits on the row's rule.
				'type-action -mb-px inline-flex min-h-11 touch-manipulation items-center justify-center gap-1.5 whitespace-nowrap rounded-none border-b-2 border-transparent px-3 text-ink-2 outline-none transition-colors duration-[var(--motion-fast)] ease-standard hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:pointer-events-none disabled:text-ink-3 aria-pressed:border-foreground aria-pressed:text-foreground md:min-h-10 large-controls:min-h-12 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
				className,
			)}
			{...props}
		/>
	)
}

export { ToggleOption, ToggleRow }
