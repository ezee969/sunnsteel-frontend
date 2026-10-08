'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import * as React from 'react'

import { cn } from '@/lib/utils'

function Tabs({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
	return (
		<TabsPrimitive.Root
			data-slot="tabs"
			className={cn('flex flex-col gap-2', className)}
			{...props}
		/>
	)
}

const TabsList = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.List>,
	React.ComponentProps<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.List
		ref={ref}
		data-slot="tabs-list"
		className={cn(
			// UX-24: the §21.3 look, so in-page tabs read as the route tabs do: a
			// row on a rule, never the stock segmented pill on a muted fill.
			'inline-flex w-fit items-end gap-1 border-b border-rule text-ink-2',
			className,
		)}
		{...props}
	/>
))
TabsList.displayName = TabsPrimitive.List.displayName

function TabsTrigger({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
	return (
		<TabsPrimitive.Trigger
			data-slot="tabs-trigger"
			className={cn(
				// §21.3: Button type in ink-2; the current tab is ink over a 2px ink
				// underline. Hover changes colour only. 44px below `md`, 40 from it.
				"type-action inline-flex min-h-11 flex-1 touch-manipulation items-center justify-center gap-1.5 whitespace-nowrap rounded-none border-b-2 border-transparent px-3 text-ink-2 outline-none transition-colors duration-[var(--motion-fast)] ease-standard hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:pointer-events-none disabled:text-ink-3 data-[state=active]:border-foreground data-[state=active]:text-foreground md:min-h-10 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			{...props}
		/>
	)
}

function TabsContent({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return (
		<TabsPrimitive.Content
			data-slot="tabs-content"
			className={cn('flex-1 outline-none', className)}
			{...props}
		/>
	)
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
