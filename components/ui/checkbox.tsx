'use client'

import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { CheckIcon } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

function Checkbox({
	className,
	...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
	return (
		<CheckboxPrimitive.Root
			data-slot="checkbox"
			className={cn(
				// Checked is `success`, not the primary control colour: a repeated
				// list control is never the region's action (v1.0 §4.3 rule 1), and
				// a ticked box means "done, as planned" (rule 2). Phase 4 made these
				// crimson and Phase 5 read fifteen of them as a column of errors.
				'peer size-4 shrink-0 rounded-none border border-rule bg-surface outline-none transition-colors duration-[var(--motion-fast)] ease-standard',
				'data-[state=checked]:border-success-strong data-[state=checked]:bg-success-strong data-[state=checked]:text-primary-foreground',
				'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40',
				'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/40',
				'disabled:cursor-not-allowed disabled:bg-surface-sunk disabled:text-ink-3',
				className,
			)}
			{...props}
		>
			<CheckboxPrimitive.Indicator
				data-slot="checkbox-indicator"
				className="flex items-center justify-center text-current transition-none"
			>
				<CheckIcon className="size-3.5" />
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	)
}

export { Checkbox }
