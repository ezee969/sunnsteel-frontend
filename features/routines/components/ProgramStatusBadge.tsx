import { Badge } from '@/components/ui/badge'
import type { Routine } from '@/lib/api/types/routine.type'
import { weeksRemainingFromEndDate, isProgramEnded } from '@/lib/utils/date'

interface ProgramStatusBadgeProps {
  routine: Routine
}

export function ProgramStatusBadge({ routine }: ProgramStatusBadgeProps) {
  if (!routine.programEndDate) return null

  if (isProgramEnded(routine.programEndDate)) {
    return (
      <Badge variant="outline" className="mr-1">
        Program ended
      </Badge>
    )
  }

  const weeksLeft = weeksRemainingFromEndDate(routine.programEndDate)
  return (
    <Badge variant="classical" className="mr-1">
      {weeksLeft} weeks left
    </Badge>
  )
}
