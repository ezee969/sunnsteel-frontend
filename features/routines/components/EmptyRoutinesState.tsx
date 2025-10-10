import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { useComponentPreloading } from '@/lib/utils/dynamic-imports'

export function EmptyRoutinesState() {
  const { preloadOnHover } = useComponentPreloading()
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
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
