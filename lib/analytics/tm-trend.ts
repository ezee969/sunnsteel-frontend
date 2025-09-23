// Lightweight client-side TM trend analytics helper.
// Aggregates TM adjustments from generated RtF logs so UI can render charts.
// No external dependency; consumer can forward events to a real analytics backend.

export interface TmAdjustmentEvent {
  exerciseId?: string
  week: number
  previousTm: number
  newTm: number
  percentChange: number
  style: 'STANDARD' | 'HYPERTROPHY'
  timestamp: number
}

export interface TmTrendSnapshot {
  exerciseId?: string
  style: 'STANDARD' | 'HYPERTROPHY'
  points: Array<{ week: number; tm: number }>
  adjustments: TmAdjustmentEvent[]
}

export class TmTrendBuffer {
  private events: TmAdjustmentEvent[] = []

  push(e: TmAdjustmentEvent) {
    this.events.push(e)
  }

  // Build a snapshot series keeping the highest week per exercise.
  snapshot(style?: 'STANDARD' | 'HYPERTROPHY', exerciseId?: string): TmTrendSnapshot {
    const filtered = this.events.filter(e => (!style || e.style === style) && (!exerciseId || e.exerciseId === exerciseId))
    const byWeek = new Map<number, number>()
    filtered.forEach(ev => {
      byWeek.set(ev.week, ev.newTm)
    })
    const points = [...byWeek.entries()].sort((a,b)=>a[0]-b[0]).map(([week, tm]) => ({ week, tm }))
    return {
      exerciseId,
      style: style || (filtered[0]?.style ?? 'STANDARD'),
      points,
      adjustments: filtered.sort((a,b)=>a.week-b.week)
    }
  }

  clear() { this.events = [] }
}

// Utility to extract TM adjustments from the unified RtF log output's action strings.
// Pattern: "TM adjusted from X to Ykg (+/-Z.Z%)".
const ADJUST_REGEX = /TM adjusted from (\d+(?:\.\d+)?) to (\d+(?:\.\d+)?)kg \(([+\-]?\d+(?:\.\d+)?)%\)/

export function deriveAdjustmentsFromLog(
  log: Array<{ week: number; tm: number; action: string }>,
  style: 'STANDARD' | 'HYPERTROPHY',
  exerciseId?: string
): TmAdjustmentEvent[] {
  const events: TmAdjustmentEvent[] = []
  for (const row of log) {
    const m = row.action.match(ADJUST_REGEX)
    if (m) {
      const prev = parseFloat(m[1])
      const next = parseFloat(m[2])
      const pct = parseFloat(m[3])
      events.push({
        exerciseId,
        week: row.week,
        previousTm: prev,
        newTm: next,
        percentChange: pct,
        style,
        timestamp: Date.now()
      })
    }
  }
  return events
}
