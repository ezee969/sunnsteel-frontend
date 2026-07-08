import type {
  RtfForecast,
  RtfForecastData,
  RtfForecastWeek,
  RtfTimeline,
} from '@/lib/api/types'

export interface ProgramSnapshot {
  id: string
  version: number
  timestamp: string
  author: string
  changeType:
    | 'creation'
    | 'modification'
    | 'deload_adjustment'
    | 'tm_adjustment'
    | 'exercise_change'
  description: string
  weekContext?: number
  changes: ProgramChange[]
  metadata: {
    targetBlocks: number
    avgIntensity: number
    estimatedVolume: number
    hasForecastData: boolean
  }
}

export interface ProgramChange {
  type:
    | 'exercise_added'
    | 'exercise_removed'
    | 'exercise_modified'
    | 'intensity_changed'
    | 'reps_changed'
    | 'sets_changed'
  exerciseName: string
  field?: string
  oldValue?: string | number
  newValue?: string | number
  impact: 'low' | 'medium' | 'high'
}

function estimateVolume(block?: RtfForecastData): number {
  if (!block) return 0
  return Math.max(0, block.fixedReps * Math.max(0, block.sets - 1)) + Math.max(0, block.amrapTarget)
}

function roundPercent(intensity?: number): number {
  if (typeof intensity !== 'number') return 0
  return Math.round(intensity * 100)
}

function buildVariantChanges(
  label: 'Standard' | 'Hypertrophy',
  current?: RtfForecastData,
  previous?: RtfForecastData,
): ProgramChange[] {
  if (!current && !previous) return []

  if (current && !previous) {
    return [
      {
        type: 'exercise_added',
        exerciseName: `${label} target block`,
        impact: 'medium',
      },
    ]
  }

  if (!current && previous) {
    return [
      {
        type: 'exercise_removed',
        exerciseName: `${label} target block`,
        impact: 'medium',
      },
    ]
  }

  if (!current || !previous) return []

  const changes: ProgramChange[] = []
  const oldIntensity = roundPercent(previous.intensity)
  const newIntensity = roundPercent(current.intensity)
  if (oldIntensity !== newIntensity) {
    changes.push({
      type: 'intensity_changed',
      exerciseName: `${label} block`,
      field: 'Intensity',
      oldValue: `${oldIntensity}%`,
      newValue: `${newIntensity}%`,
      impact: Math.abs(newIntensity - oldIntensity) >= 5 ? 'high' : 'medium',
    })
  }

  if (previous.fixedReps !== current.fixedReps) {
    changes.push({
      type: 'reps_changed',
      exerciseName: `${label} block`,
      field: 'Fixed reps',
      oldValue: previous.fixedReps,
      newValue: current.fixedReps,
      impact: 'medium',
    })
  }

  if (previous.sets !== current.sets) {
    changes.push({
      type: 'sets_changed',
      exerciseName: `${label} block`,
      field: 'Sets',
      oldValue: previous.sets,
      newValue: current.sets,
      impact: Math.abs(previous.sets - current.sets) >= 2 ? 'high' : 'medium',
    })
  }

  if (previous.amrapTarget !== current.amrapTarget) {
    changes.push({
      type: 'reps_changed',
      exerciseName: `${label} block`,
      field: 'AMRAP target',
      oldValue: previous.amrapTarget,
      newValue: current.amrapTarget,
      impact: 'low',
    })
  }

  return changes
}

export function buildSnapshots(
  timeline: RtfTimeline | undefined,
  forecast: RtfForecast | undefined,
): ProgramSnapshot[] {
  if (!timeline?.timeline?.length) return []

  const forecastByWeek = new Map<number, RtfForecastWeek>(
    (forecast?.forecast ?? []).map((week) => [week.week, week]),
  )

  return timeline.timeline.map((entry, index) => {
    const current = forecastByWeek.get(entry.week)
    const previous = index > 0 ? forecastByWeek.get(timeline.timeline[index - 1].week) : undefined

    const baseChanges: ProgramChange[] = [
      ...buildVariantChanges('Standard', current?.standard, previous?.standard),
      ...buildVariantChanges('Hypertrophy', current?.hypertrophy, previous?.hypertrophy),
    ]

    const deloadTransition =
      entry.isDeload && previous && !previous.isDeload
        ? [
            {
              type: 'intensity_changed' as const,
              exerciseName: 'Program',
              field: 'Week type',
              oldValue: 'Training',
              newValue: 'Deload',
              impact: 'high' as const,
            },
          ]
        : []

    const changes = [...deloadTransition, ...baseChanges]
    const blocks = [current?.standard, current?.hypertrophy].filter(Boolean) as RtfForecastData[]
    const avgIntensity =
      blocks.length > 0
        ? Math.round(
            (blocks.reduce((sum, block) => sum + roundPercent(block.intensity), 0) / blocks.length) *
              10,
          ) / 10
        : 0
    const estimatedVolume = blocks.reduce((sum, block) => sum + estimateVolume(block), 0)

    const changeType: ProgramSnapshot['changeType'] =
      index === 0
        ? 'creation'
        : entry.isDeload
          ? 'deload_adjustment'
          : changes.some((change) => change.type === 'exercise_added' || change.type === 'exercise_removed')
            ? 'exercise_change'
            : 'modification'

    const description =
      index === 0
        ? 'Initial programmed week generated from current RtF settings'
        : entry.isDeload
          ? 'Deload week targets and workload reduction'
          : `Week ${entry.week} progression targets`

    return {
      id: `week-${entry.week}`,
      version: index + 1,
      timestamp: entry.endDate ?? entry.startDate,
      author: 'System',
      changeType,
      description,
      weekContext: entry.week,
      changes,
      metadata: {
        targetBlocks: blocks.length,
        avgIntensity,
        estimatedVolume,
        hasForecastData: !!current,
      },
    }
  })
}
