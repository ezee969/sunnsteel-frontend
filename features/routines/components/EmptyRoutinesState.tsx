import { PlusCircle } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { useComponentPreloading } from '@/lib/utils/dynamic-imports'

/**
 * Renders a centered empty-state UI prompting the user to create a new routine.
 *
 * The call-to-action button links to "/routines/new" and triggers component preloading for the new-routine page on hover.
 *
 * @returns A React element containing a titled empty state, supporting subtitle text and a button-styled link to create a routine.
 */
export function EmptyRoutinesState() {
	const { preloadOnHover } = useComponentPreloading()
	return (
		<div className="flex h-full flex-col items-center justify-center rounded-sm border border-dashed border-rule p-8 text-center">
			<h3 className="type-section mb-1 text-foreground">
				You have no routines
			</h3>
			<p className="type-body-sm mb-4 text-ink-3">
				Get started by creating a new routine.
			</p>
			<Button asChild variant="default">
				<Link href="/routines/new" {...preloadOnHover('newRoutinePage')}>
					<PlusCircle className="mr-2 h-4 w-4" />
					Create Routine
				</Link>
			</Button>
		</div>
	)
}
