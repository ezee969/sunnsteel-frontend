'use client'

import * as LabelPrimitive from '@radix-ui/react-label'
import * as React from 'react'

import { cn } from '@/lib/utils'

function Label({
	className,
	...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
	return (
		<LabelPrimitive.Root
			data-slot="label"
			className={cn(
				// §11.6: field labels sit above the field in the body-small rank,
				// not as tracked micro-caps - those are region captions only (§5.3).
				'type-body-sm flex items-center gap-2 leading-none text-ink-3 select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:text-ink-3 peer-disabled:cursor-not-allowed peer-disabled:text-ink-3',
				className,
			)}
			{...props}
		/>
	)
}

export { Label }
