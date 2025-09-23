// Unified Reps-to-Failure program generator (STANDARD + HYPERTROPHY)
// Clean implementation (duplicates removed) with options:
// - style: 'STANDARD' | 'HYPERTROPHY'
// - withDeloads: filter out deload weeks (reindexes weeks)
// - roundingIncrementKg: weight rounding increment

export interface RepsToFailureConfig {
  initialWeight: number
  style?: 'STANDARD' | 'HYPERTROPHY'
  withDeloads?: boolean
  roundingIncrementKg?: number
}

export interface UserPerformance {
  week: number // ORIGINAL week number (1..21) from the canonical table
  repsOnLastSet: number
  setsCompleted: number
  singleAt8?: number
}

export interface RepsToFailureLog {
  week: number // DISPLAY week (reindexed if deloads removed)
  tm: number
  weight: number
  goal: string
  action: string
}

export function createInitialRepsToFailureConfig(initialWeight: number): RepsToFailureConfig {
  return { initialWeight }
}

// ---- Table Types ----
type CoreWeek = { week: number }
type StandardWeek = CoreWeek & { intensity: number; sets: number; reps: number; amrapTarget: number }
type HypertrophyWeek = CoreWeek & { intensity: number; sets: number; reps: number; amrapTarget: number }
type DeloadWeek = CoreWeek & { isDeload: true; intensity?: number; sets?: number; reps?: number }

const STANDARD_TABLE: readonly (StandardWeek | DeloadWeek)[] = [
  { week: 1, intensity: 0.7, sets: 5, reps: 5, amrapTarget: 10 },
  { week: 2, intensity: 0.75, sets: 5, reps: 4, amrapTarget: 8 },
  { week: 3, intensity: 0.8, sets: 5, reps: 3, amrapTarget: 6 },
  { week: 4, intensity: 0.725, sets: 5, reps: 5, amrapTarget: 9 },
  { week: 5, intensity: 0.775, sets: 5, reps: 4, amrapTarget: 7 },
  { week: 6, intensity: 0.825, sets: 5, reps: 3, amrapTarget: 5 },
  { week: 7, isDeload: true },
  { week: 8, intensity: 0.75, sets: 5, reps: 4, amrapTarget: 8 },
  { week: 9, intensity: 0.8, sets: 5, reps: 3, amrapTarget: 6 },
  { week: 10, intensity: 0.85, sets: 5, reps: 2, amrapTarget: 4 },
  { week: 11, intensity: 0.775, sets: 5, reps: 4, amrapTarget: 7 },
  { week: 12, intensity: 0.825, sets: 5, reps: 3, amrapTarget: 5 },
  { week: 13, intensity: 0.875, sets: 5, reps: 2, amrapTarget: 3 },
  { week: 14, isDeload: true },
  { week: 15, intensity: 0.8, sets: 5, reps: 3, amrapTarget: 6 },
  { week: 16, intensity: 0.85, sets: 5, reps: 2, amrapTarget: 4 },
  { week: 17, intensity: 0.9, sets: 5, reps: 1, amrapTarget: 2 },
  { week: 18, intensity: 0.85, sets: 5, reps: 2, amrapTarget: 4 },
  { week: 19, intensity: 0.9, sets: 5, reps: 1, amrapTarget: 2 },
  { week: 20, intensity: 0.95, sets: 5, reps: 1, amrapTarget: 2 },
  { week: 21, isDeload: true },
] as const

export const weeklyGoalDataHypertrophy: readonly (HypertrophyWeek | DeloadWeek)[] = [
  { week: 1, intensity: 0.7, sets: 4, reps: 10, amrapTarget: 12 },
  { week: 2, intensity: 0.725, sets: 4, reps: 9, amrapTarget: 11 },
  { week: 3, intensity: 0.75, sets: 4, reps: 8, amrapTarget: 10 },
  { week: 4, intensity: 0.725, sets: 4, reps: 9, amrapTarget: 11 },
  { week: 5, intensity: 0.75, sets: 4, reps: 8, amrapTarget: 10 },
  { week: 6, intensity: 0.775, sets: 4, reps: 7, amrapTarget: 9 },
  { week: 7, intensity: 0.6, sets: 4, reps: 5, isDeload: true },
  { week: 8, intensity: 0.725, sets: 4, reps: 9, amrapTarget: 11 },
  { week: 9, intensity: 0.75, sets: 4, reps: 8, amrapTarget: 10 },
  { week: 10, intensity: 0.775, sets: 4, reps: 7, amrapTarget: 9 },
  { week: 11, intensity: 0.75, sets: 4, reps: 8, amrapTarget: 10 },
  { week: 12, intensity: 0.775, sets: 4, reps: 7, amrapTarget: 9 },
  { week: 13, intensity: 0.8, sets: 4, reps: 6, amrapTarget: 8 },
  { week: 14, intensity: 0.6, sets: 4, reps: 5, isDeload: true },
  { week: 15, intensity: 0.75, sets: 4, reps: 8, amrapTarget: 10 },
  { week: 16, intensity: 0.775, sets: 4, reps: 7, amrapTarget: 9 },
  { week: 17, intensity: 0.8, sets: 4, reps: 6, amrapTarget: 8 },
  { week: 18, intensity: 0.775, sets: 4, reps: 7, amrapTarget: 9 },
  { week: 19, intensity: 0.8, sets: 4, reps: 6, amrapTarget: 8 },
  { week: 20, intensity: 0.825, sets: 4, reps: 5, amrapTarget: 6 },
  { week: 21, intensity: 0.6, sets: 4, reps: 5, isDeload: true },
] as const

// --- Helpers ---
function roundToNearest(value: number, inc: number): number {
  return Math.round(value / inc) * inc
}

function adjustTM(reps: number, target: number, tm: number): number {
  const diff = reps - target
  if (diff > 0) {
    if (diff >= 5) return tm * 1.03
    if (diff === 4) return tm * 1.02
    if (diff === 3) return tm * 1.015
    if (diff === 2) return tm * 1.01
    if (diff === 1) return tm * 1.005
  } else if (diff === 0) return tm
  else {
    if (diff <= -2) return tm * 0.95
    if (diff === -1) return tm * 0.98
  }
  return tm
}

export function generateRepsToFailureProgram(
  config: RepsToFailureConfig,
  performance: UserPerformance[]
): RepsToFailureLog[] {
  const style = config.style ?? 'STANDARD'
  const base = style === 'HYPERTROPHY' ? weeklyGoalDataHypertrophy : STANDARD_TABLE
  const withDeloads = config.withDeloads !== false
  const roundingInc = config.roundingIncrementKg ?? 5
  const filtered = withDeloads ? base : base.filter(w => !('isDeload' in w && w.isDeload))

  const logs: RepsToFailureLog[] = []
  let currentTM = config.initialWeight

  filtered.forEach((goal, idx) => {
    const displayWeek = idx + 1
    let action = `Using TM: ${currentTM.toFixed(1)}kg.`
    if (displayWeek === 1) action = `Starting TM: ${currentTM.toFixed(1)}kg.`
    else {
      // previous kept week original week number
      const prevWeekData = filtered[idx - 1]
      const prevOriginalWeek = prevWeekData.week
      const prevPerf = performance.find(p => p.week === prevOriginalWeek)
      const prevGoal = base.find(g => g.week === prevOriginalWeek)
      
      if (prevPerf && prevGoal && !('isDeload' in prevGoal && prevGoal.isDeload)) {
        const standardGoal = prevGoal as StandardWeek | HypertrophyWeek
        const newTM = adjustTM(prevPerf.repsOnLastSet, standardGoal.amrapTarget, currentTM)
        const delta = newTM - currentTM
        if (delta !== 0) {
          const pct = (delta / currentTM) * 100
          action = `Last week: ${prevPerf.repsOnLastSet}/${standardGoal.amrapTarget} reps. TM adjusted from ${currentTM.toFixed(1)} to ${newTM.toFixed(1)}kg (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%).`
        } else {
          action = `Last week: ${prevPerf.repsOnLastSet}/${standardGoal.amrapTarget} reps. TM unchanged at ${currentTM.toFixed(1)}kg.`
        }
        currentTM = newTM
      }
    }

    if ('isDeload' in goal && goal.isDeload) {
      const deloadGoal = goal as DeloadWeek
      const pct = deloadGoal.intensity ?? 0.6
      logs.push({
        week: displayWeek,
        tm: currentTM,
        weight: roundToNearest(currentTM * pct, roundingInc),
        goal: style === 'HYPERTROPHY'
          ? `${deloadGoal.sets ?? 4}x${deloadGoal.reps ?? 5} @ ${(pct * 100).toFixed(0)}% (no rep targets)`
          : '3x5 @ RPE 6',
        action: 'Deload Week'
      })
    } else {
      const g = goal as StandardWeek | HypertrophyWeek
      logs.push({
        week: displayWeek,
        tm: currentTM,
        weight: roundToNearest(currentTM * g.intensity, roundingInc),
        goal: `${g.sets}x${g.reps} (last set AMRAP ${g.amrapTarget}+)`,
        action
      })
    }
  })

  return logs
}

export function generateRepsToFailureHypertrophyProgram(
  config: Omit<RepsToFailureConfig, 'style'>,
  performance: UserPerformance[]
): RepsToFailureLog[] {
  return generateRepsToFailureProgram({ ...config, style: 'HYPERTROPHY' }, performance)
}
