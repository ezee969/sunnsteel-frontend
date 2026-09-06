import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
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
    <div className="flex h-[calc(100vh-300px)] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <h3 className="text-2xl font-bold tracking-tight">You have no routines</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Get started by creating a new routine.
      </p>
      <Button asChild variant="classical">
        <Link href="/routines/new" {...preloadOnHover('newRoutinePage')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Routine
        </Link>
      </Button>
    </div>
  )
}
