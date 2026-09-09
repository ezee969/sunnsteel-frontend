import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
	"type-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm shrink-0 outline-none transition-colors duration-[var(--motion-fast)] ease-standard disabled:pointer-events-none disabled:text-ink-3 disabled:bg-surface-sunk [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive active:translate-y-[1px]",
	{
		variants: {
			variant: {
				// The one primary control per region (v1.0 §4.3 rule 1). Ink, not
				// crimson: Phase 4 put crimson here and Phase 5 read the result as
				// "a page full of errors or destructive controls".
				default: 'bg-primary text-primary-foreground hover:bg-primary-hover',
				// §4.3 rule 5 and §11.4: destructive is an outline by default,
				// because most destructive controls sit beside a primary and a
				// second fill makes them look alike. It fills only when the control
				// destroys data, via `variant="destructiveSolid"`.
				destructive:
					'border border-destructive bg-transparent text-destructive hover:bg-destructive/10',
				destructiveSolid:
					'bg-destructive text-destructive-foreground hover:bg-destructive/90',
				outline: 'border border-rule bg-transparent hover:bg-surface',
				secondary: 'border border-rule bg-surface hover:bg-muted',
				ghost:
					'text-ink-2 hover:text-foreground hover:underline hover:underline-offset-4',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-10 px-5 has-[>svg]:px-4',
				sm: 'h-9 gap-1.5 px-3 has-[>svg]:px-2.5',
				lg: 'h-11 px-6 has-[>svg]:px-5',
				icon: 'size-10',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
)

const Button = React.forwardRef<
	HTMLButtonElement,
	React.ComponentProps<'button'> &
		VariantProps<typeof buttonVariants> & {
			asChild?: boolean
		}
>(({ className, variant, size, asChild = false, ...props }, ref) => {
	const Comp = asChild ? Slot : 'button'

	return (
		<Comp
			ref={ref}
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	)
})
Button.displayName = 'Button'

export { Button, buttonVariants }
