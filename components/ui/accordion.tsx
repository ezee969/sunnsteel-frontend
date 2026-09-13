'use client'

import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDownIcon } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

function Accordion({
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
	return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({
	className,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
	return (
		<AccordionPrimitive.Item
			data-slot="accordion-item"
			className={cn('border-b last:border-b-0', className)}
			{...props}
		/>
	)
}

function AccordionTrigger({
	className,
	children,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
	return (
		<AccordionPrimitive.Header className="flex">
			<AccordionPrimitive.Trigger
				data-slot="accordion-trigger"
				// The trigger is the text inside Radix's `<h3>` header, so it carries
				// the heading's rank itself (§5.3, panel). Before Phase 15 the global
				// `h1`-`h4` rule styled it Bebas; with that rule gone it fell back to
				// the system face. No `text-*`/`font-*` beside the rank: utilities
				// would override it.
				className={cn(
					'type-panel focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-foreground transition-colors duration-[var(--motion-fast)] ease-standard outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:text-ink-3 [&[data-state=open]>svg]:rotate-180',
					className,
				)}
				{...props}
			>
				{children}
				<ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-[var(--motion-base)] ease-standard" />
			</AccordionPrimitive.Trigger>
		</AccordionPrimitive.Header>
	)
}

function AccordionContent({
	className,
	children,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
	return (
		<AccordionPrimitive.Content
			data-slot="accordion-content"
			className={cn(
				// Motion spec §2.7: height changes instantly, the reveal is opacity only.
				// The row-template transition this replaced was a layout animation -
				// on the never-list (§1.2) and the most expensive frame cost on a
				// phone. Do not write that class name here even in a comment: Tailwind
				// v4 scans source text and would compile it back into the bundle.
				'grid overflow-hidden text-sm',
				'data-[state=closed]:grid-rows-[0fr] data-[state=open]:grid-rows-[1fr]',
				'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-[var(--motion-fast)] data-[state=open]:ease-standard',
			)}
			{...props}
		>
			<div className={cn('min-h-0 overflow-hidden pt-0 pb-4', className)}>
				{children}
			</div>
		</AccordionPrimitive.Content>
	)
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger }
