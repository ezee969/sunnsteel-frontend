import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				// v1.0 §11.6. Every editable field has a VISIBLE resting boundary,
				// in both themes. v0.1 specified none and relied on a tonal step;
				// Phase 5 found the fields read as a read-only ledger, and because
				// the old base carried `dark:bg-input/30` while light did not, one
				// component had two models. The fill is now stated per theme rather
				// than left to a `dark:` rule.
				'flex h-11 w-full min-w-0 rounded-sm border border-rule bg-surface px-3 py-1 text-base outline-none transition-colors duration-[var(--motion-fast)] ease-standard md:h-10 md:text-sm',
				'file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
				'placeholder:text-ink-3 selection:bg-primary selection:text-primary-foreground',
				// 16px below `md` is an iOS zoom-on-focus mitigation (TD-29), not a
				// type choice: `text-base` here and `md:text-sm` above keep it.
				'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-sunk disabled:text-ink-3',
				'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40',
				'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/40',
				className,
			)}
			{...props}
		/>
	)
}

export { Input }
