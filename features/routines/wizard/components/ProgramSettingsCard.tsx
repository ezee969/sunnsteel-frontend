'use client'

import { RoutineWizardData } from '../types'
import { formatDateForDisplay } from '../utils/date'
import { getProgramWeekInfo } from '../utils/routine-summary'

interface ProgramSettingsCardProps {
	data: RoutineWizardData
	usesRtf: boolean
	isEditing: boolean
}

export function ProgramSettingsCard({ data, usesRtf, isEditing }: ProgramSettingsCardProps) {
  if (!usesRtf) {
    return null
  }

  const { totalWeeks, startWeek } = getProgramWeekInfo(data)
  const derivedStyle: 'STANDARD' | 'HYPERTROPHY' | 'UNKNOWN' = (() => {
    const hasHyp = data.days.some((d) =>
      d.exercises.some((e) => e.progressionScheme === 'PROGRAMMED_RTF_HYPERTROPHY'),
    )
    const hasStd = data.days.some((d) => d.exercises.some((e) => e.progressionScheme === 'PROGRAMMED_RTF'))
    if (hasHyp) return 'HYPERTROPHY'
    if (hasStd) return 'STANDARD'
    return 'UNKNOWN'
  })()

  return (
    <div className="rounded-lg border bg-card text-card-foreground p-4">
      <h3 className="text-base font-semibold leading-none tracking-tight mb-3">
        Program Settings (RtF)
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Include deload weeks</p>
          <p className="font-medium">{data.programWithDeloads ? 'Yes' : 'No'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Start date</p>
          <p className="font-medium">{formatDateForDisplay(data.programStartDate)}</p>
        </div>
        {!isEditing && (
          <div>
            <p className="text-muted-foreground">Start Program Week</p>
            <p className="font-medium">
              Week {startWeek} of {totalWeeks}
            </p>
          </div>
        )}
        <div>
          <p className="text-muted-foreground">Program Style</p>
          <p className="font-medium">{derivedStyle}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Total weeks</p>
          <p className="font-medium">{totalWeeks}</p>
        </div>
      </div>
    </div>
  )
}
