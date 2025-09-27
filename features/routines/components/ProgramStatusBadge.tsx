import { Badge } from '@/components/ui/badge'
import type { Routine } from '@/lib/api/types/routine.type'
import { weeksRemainingFromEndDate } from '@/lib/utils/date'

interface ProgramStatusBadgeProps {
  routine: Routine
}

function isProgramEnded(routine: Routine): boolean {
  if (!routine.programEndDate) return false
  const today = new Date()
  const todayUTC = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  )
  const end = new Date(routine.programEndDate)
  const endUTC = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate(),
  )
  return todayUTC > endUTC
}

export function ProgramStatusBadge({ routine }: ProgramStatusBadgeProps) {
  if (!routine.programEndDate) return null

  if (isProgramEnded(routine)) {
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
