import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface RoutinesSkeletonListProps {
  count?: number
}

/**
 * Render a vertical list of skeleton loading cards representing routines.
 *
 * @param count - Number of skeleton cards to render (defaults to 3)
 * @returns A JSX element containing `count` skeleton cards used as loading placeholders
 */
export function RoutinesSkeletonList({ count = 3 }: RoutinesSkeletonListProps) {
  return (
    <div className="px-1 sm:pr-4 sm:pl-0">
      <div className="grid gap-3 sm:gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="p-4 sm:px-6 sm:py-4">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2 pr-4">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-60" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:px-6 sm:pb-4 sm:pt-0">
              <div className="space-y-2 mb-3">
                <Skeleton className="h-3 w-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-6 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
