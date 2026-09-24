import { PlusCircle } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { StarterTemplates } from '@/features/routines/components/StarterTemplates'
import { useComponentPreloading } from '@/lib/utils/dynamic-imports'

/**
 * Renders a centered empty-state UI prompting the user to create a new routine.
 *
 * The call-to-action button links to "/routines/new" and triggers component preloading for the new-routine page on hover.
 * ROUT-03: the starter templates sit beneath it, each opening the wizard as a draft.
 *
 * @returns A React element containing a titled empty state, supporting subtitle text and a button-styled link to create a routine.
 */
export function EmptyRoutinesState({
	filtered = false,
}: {
	filtered?: boolean
}) {
	const { preloadOnHover } = useComponentPreloading()
	// A filter that matches nothing is not an account without routines, so it
	// neither says so nor offers the templates.
	if (filtered) {
		return (
			<div className="flex flex-col items-center rounded-sm border border-dashed border-rule p-8 text-center">
				<h3 className="type-section mb-1 text-foreground">
					No routines match this filter
				</h3>
				<p className="type-body-sm text-ink-3">
					Choose All Workout Routines to see every routine you have.
				</p>
			</div>
		)
	}
	return (
		<div className="flex flex-col items-center rounded-sm border border-dashed border-rule p-8 text-center">
			<h3 className="type-section mb-1 text-foreground">
				You have no routines
			</h3>
			<p className="type-body-sm mb-4 text-ink-3">
				Start from a template below, or build your own.
			</p>
			<Button asChild variant="default">
				<Link href="/routines/new" {...preloadOnHover('newRoutinePage')}>
					<PlusCircle className="mr-2 h-4 w-4" />
					Create Routine
				</Link>
			</Button>
			<div className="mt-8 w-full max-w-2xl">
				<StarterTemplates />
			</div>
		</div>
	)
}
