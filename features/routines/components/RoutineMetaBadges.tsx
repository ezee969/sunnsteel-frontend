import { Badge } from '@/components/ui/badge'
import { ClassicalIcon } from '@/components/icons/ClassicalIcon'

interface RoutineMetaBadgesProps {
  daysPerWeek: number
  isPeriodized?: boolean
}

/**
 * Renders a compact set of badges describing routine metadata.
 *
 * @param daysPerWeek - Number of training days per week shown in the dumbbell badge.
 * @param isPeriodized - If true, includes an additional "Periodized" badge.
 * @returns A JSX element containing the days-per-week badge and, when applicable, a periodization badge.
 */
export function RoutineMetaBadges({ daysPerWeek, isPeriodized }: RoutineMetaBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
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
