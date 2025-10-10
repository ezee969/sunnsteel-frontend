import { Badge } from '@/components/ui/badge'
import { ClassicalIcon } from '@/components/icons/ClassicalIcon'
import { cn } from '@/lib/utils'

interface RoutineMetaBadgesProps {
  daysPerWeek: number
  isPeriodized?: boolean
  className?: string
}

export function RoutineMetaBadges({
  daysPerWeek,
  isPeriodized,
  className,
}: RoutineMetaBadgesProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <Badge
        variant="outline"
        className="flex items-center gap-1 text-xs sm:text-sm"
      >
        <ClassicalIcon name="dumbbell" className="h-3 w-3 flex-shrink-0" aria-hidden />
        <span>{daysPerWeek} days/week</span>
      </Badge>
      {isPeriodized && (
        <Badge variant="outline" className="text-xs sm:text-sm">
          Periodized
        </Badge>
      )}
    </div>
  )
}
