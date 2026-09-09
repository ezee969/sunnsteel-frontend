import * as React from 'react'

import { cn } from '@/lib/utils'

function Card({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="card"
			className={cn(
				// v1.0 §11.5 `panel`: surface, 2px radius, 1px rule, no shadow.
				// The gold-tinted gradient, marble wash and drop shadow are all
				// retired - elevation is tonal (§8), and nothing in this system is
				// translucent. Two further variants, `ruled` (no fill, no box) and
				// `sunk` (well), are applied per call site in Phase 8 rather than
				// added here, since Card has no cva and 26 files pass their own
				// className.
				'flex flex-col gap-6 rounded-sm border border-rule bg-surface py-6 text-card-foreground',
				className,
			)}
			{...props}
		/>
	)
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="card-header"
			className={cn('flex flex-col gap-1.5 px-6', className)}
			{...props}
		/>
	)
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="card-title"
			className={cn('type-panel leading-tight', className)}
			{...props}
		/>
	)
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="card-description"
			className={cn('type-body-sm text-ink-2', className)}
			{...props}
		/>
	)
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="card-content"
			className={cn('px-6', className)}
			{...props}
		/>
	)
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="card-footer"
			className={cn('flex items-center px-6', className)}
			{...props}
		/>
	)
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
