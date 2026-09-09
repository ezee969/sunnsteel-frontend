import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
	'type-label inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-none border px-2 py-0.5 whitespace-nowrap transition-colors duration-[var(--motion-fast)] ease-standard [&>svg]:size-3 [&>svg]:pointer-events-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive',
	{
		variants: {
			variant: {
				default:
					'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary-hover',
				secondary: 'border-rule bg-surface text-ink-2',
				// §4.3 rule 5 — outline, so a badge never looks like a filled
				// destructive control.
				destructive: 'border-destructive bg-transparent text-destructive',
				outline: 'border-rule bg-transparent text-foreground',
				// §4.3 rule 2 — done, as planned.
				success: 'border-success bg-transparent text-success',
				// §4.3 rule 3 — better than planned. At most two per viewport.
				honour: 'border-honour bg-transparent text-honour',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
)

function Badge({
	className,
	variant,
	asChild = false,
	...props
}: React.ComponentProps<'span'> &
	VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : 'span'

	return (
		<Comp
			data-slot="badge"
			className={cn(badgeVariants({ variant }), className)}
			{...props}
		/>
	)
}

export { Badge, badgeVariants }
