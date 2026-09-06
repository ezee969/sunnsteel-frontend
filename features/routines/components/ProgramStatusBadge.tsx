import { Badge } from '@/components/ui/badge'
import type { Routine } from '@/lib/api/types/routine.type'
import { weeksRemainingFromEndDate } from '@/lib/utils/date'

interface ProgramStatusBadgeProps {
  routine: Routine
}

/**
 * Determines whether a routine's program has ended based on UTC dates.
 *
 * @param routine - Routine object whose `programEndDate` is checked
 * @returns `true` if today's UTC date is after the program end UTC date, `false` otherwise (also `false` if `programEndDate` is not set)
 */
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

/**
 * Render a status badge that indicates whether a routine's program has ended or how many weeks remain.
 *
 * @param routine - The routine whose program end date determines the badge content
 * @returns A JSX badge element describing the program status, or `null` if the routine has no `programEndDate`
 */
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
