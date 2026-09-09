import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				// Same field model as Input (§11.6): visible resting boundary in both
				// themes, 16px below `md`.
				'flex field-sizing-content min-h-16 w-full rounded-sm border border-rule bg-surface px-3 py-2 text-base outline-none transition-colors duration-[var(--motion-fast)] ease-standard md:text-sm',
				'placeholder:text-ink-3',
				'disabled:cursor-not-allowed disabled:bg-surface-sunk disabled:text-ink-3',
				'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40',
				'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/40',
				className,
			)}
			{...props}
		/>
	)
}

export { Textarea }
