export interface RepsToFailureConfig {
  initialWeight: number;
}

// Hypertrophy variant: 4 sets (3 + 1 AMRAP). Deloads at 60% intensity with 5 reps, no AMRAP target.
export function generateRepsToFailureHypertrophyProgram(
  config: RepsToFailureConfig,
  performance: UserPerformance[]
): RepsToFailureLog[] {
  const logs: RepsToFailureLog[] = [];
  let currentTM = config.initialWeight;

  for (let week = 1; week <= 21; week++) {
    const goalData = weeklyGoalDataHypertrophy.find((g) => g.week === week)!;

    let action = `Using TM: ${currentTM.toFixed(1)}kg.`;
    if (week === 1) {
      action = `Starting TM: ${currentTM.toFixed(1)}kg.`;
    } else {
      const prevWeekPerf = performance.find((p) => p.week === week - 1);
      const prevGoalData = weeklyGoalDataHypertrophy.find((g) => g.week === week - 1)!;
      if (prevWeekPerf && !prevGoalData.isDeload) {
        const repsDone = prevWeekPerf.repsOnLastSet;
        if (repsDone) {
          const newTM = calculateTMAdjustment(
            repsDone,
            prevGoalData.amrapTarget!,
            currentTM
          );
          const tmChange = newTM - currentTM;
          const tmChangePercent = (tmChange / currentTM) * 100;

          if (tmChange !== 0) {
            action = `Last week: ${repsDone}/${prevGoalData.amrapTarget!} reps. TM adjusted from ${currentTM.toFixed(
              1
            )} to ${newTM.toFixed(1)}kg (${tmChangePercent >= 0 ? '+' : ''}${tmChangePercent.toFixed(1)}%).`;
          } else {
            action = `Last week: ${repsDone}/${prevGoalData.amrapTarget!} reps. TM unchanged at ${currentTM.toFixed(
              1
            )}kg.`;
          }
          currentTM = newTM;
        }
      } else if (!prevGoalData.isDeload) {
        action = `TM unchanged at ${currentTM.toFixed(1)}kg. Waiting for W${week - 1} data.`;
      }
    }

    if (goalData.isDeload) {
      const pct = goalData.intensity ? (goalData.intensity * 100).toFixed(0) : '60';
      logs.push({
        week,
        tm: currentTM,
        weight: roundToNearest(currentTM * (goalData.intensity ?? 0.6), 5),
        goal: `${goalData.sets ?? 4}x${goalData.reps ?? 5} @ ${pct}% (no rep targets)`,
        action: 'Deload Week',
      });
    } else {
      logs.push({
        week,
        tm: currentTM,
        weight: roundToNearest(currentTM * goalData.intensity!, 5),
        goal: `${goalData.sets!}x${goalData.reps!} (last set AMRAP ${goalData.amrapTarget!}+)`,
        action,
      });
    }
  }

  return logs;
}

export interface UserPerformance {
  week: number;
  repsOnLastSet: number;
  setsCompleted: number;
  singleAt8?: number;
}

export interface RepsToFailureLog {
  week: number;
  tm: number;
  weight: number;
  goal: string;
  action: string;
}

// Function to create initial configuration for a new exercise
export function createInitialRepsToFailureConfig(
  initialWeight: number
): RepsToFailureConfig {
  return { initialWeight };
}

const weeklyGoalData = [
  // Block 1
  { week: 1, intensity: 0.7, sets: 5, reps: 5, amrapTarget: 10 },
  { week: 2, intensity: 0.75, sets: 5, reps: 4, amrapTarget: 8 },
  { week: 3, intensity: 0.8, sets: 5, reps: 3, amrapTarget: 6 },
  { week: 4, intensity: 0.725, sets: 5, reps: 5, amrapTarget: 9 },
  { week: 5, intensity: 0.775, sets: 5, reps: 4, amrapTarget: 7 },
  { week: 6, intensity: 0.825, sets: 5, reps: 3, amrapTarget: 5 },
  { week: 7, isDeload: true },
  // Block 2
  { week: 8, intensity: 0.75, sets: 5, reps: 4, amrapTarget: 8 },
  { week: 9, intensity: 0.8, sets: 5, reps: 3, amrapTarget: 6 },
  { week: 10, intensity: 0.85, sets: 5, reps: 2, amrapTarget: 4 },
  { week: 11, intensity: 0.775, sets: 5, reps: 4, amrapTarget: 7 },
  { week: 12, intensity: 0.825, sets: 5, reps: 3, amrapTarget: 5 },
  { week: 13, intensity: 0.875, sets: 5, reps: 2, amrapTarget: 3 },
  { week: 14, isDeload: true },
  // Block 3
  { week: 15, intensity: 0.8, sets: 5, reps: 3, amrapTarget: 6 },
  { week: 16, intensity: 0.85, sets: 5, reps: 2, amrapTarget: 4 },
  { week: 17, intensity: 0.9, sets: 5, reps: 1, amrapTarget: 2 },
  { week: 18, intensity: 0.85, sets: 5, reps: 2, amrapTarget: 4 },
  { week: 19, intensity: 0.9, sets: 5, reps: 1, amrapTarget: 2 },
  { week: 20, intensity: 0.95, sets: 5, reps: 1, amrapTarget: 2 },
  { week: 21, isDeload: true },
];

export const weeklyGoalDataHypertrophy = [
  // Block 1
  { week: 1, intensity: 0.7, sets: 4, reps: 10, amrapTarget: 12 },
  { week: 2, intensity: 0.725, sets: 4, reps: 9, amrapTarget: 11 },
  { week: 3, intensity: 0.75, sets: 4, reps: 8, amrapTarget: 10 },
  { week: 4, intensity: 0.725, sets: 4, reps: 9, amrapTarget: 11 },
  { week: 5, intensity: 0.75, sets: 4, reps: 8, amrapTarget: 10 },
  { week: 6, intensity: 0.775, sets: 4, reps: 7, amrapTarget: 9 },
  { week: 7, intensity: 0.6, sets: 4, reps: 5, isDeload: true },

  // Block 2
  { week: 8, intensity: 0.725, sets: 4, reps: 9, amrapTarget: 11 },
  { week: 9, intensity: 0.75, sets: 4, reps: 8, amrapTarget: 10 },
  { week: 10, intensity: 0.775, sets: 4, reps: 7, amrapTarget: 9 },
  { week: 11, intensity: 0.75, sets: 4, reps: 8, amrapTarget: 10 },
  { week: 12, intensity: 0.775, sets: 4, reps: 7, amrapTarget: 9 },
  { week: 13, intensity: 0.8, sets: 4, reps: 6, amrapTarget: 8 },
  { week: 14, intensity: 0.6, sets: 4, reps: 5, isDeload: true },

  // Block 3
  { week: 15, intensity: 0.75, sets: 4, reps: 8, amrapTarget: 10 },
  { week: 16, intensity: 0.775, sets: 4, reps: 7, amrapTarget: 9 },
  { week: 17, intensity: 0.8, sets: 4, reps: 6, amrapTarget: 8 },
  { week: 18, intensity: 0.775, sets: 4, reps: 7, amrapTarget: 9 },
  { week: 19, intensity: 0.8, sets: 4, reps: 6, amrapTarget: 8 },
  { week: 20, intensity: 0.825, sets: 4, reps: 5, amrapTarget: 6 },
  { week: 21, intensity: 0.6, sets: 4, reps: 5, isDeload: true },
];

// Function to round to nearest increment
function roundToNearest(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}

// Function to calculate TM adjustment based on performance
function calculateTMAdjustment(
  repsDone: number,
  targetReps: number,
  currentTM: number
): number {
  const difference = repsDone - targetReps;

  if (difference > 0) {
    // Superó el objetivo - aumentar TM según las reglas de porcentaje
    if (difference >= 5) {
      return currentTM * 1.03; // +3.00% por 5+ repeticiones extra
    } else if (difference === 4) {
      return currentTM * 1.02; // +2.00% por 4 repeticiones extra
    } else if (difference === 3) {
      return currentTM * 1.015; // +1.50% por 3 repeticiones extra
    } else if (difference === 2) {
      return currentTM * 1.01; // +1.00% por 2 repeticiones extra
    } else if (difference === 1) {
      return currentTM * 1.005; // +0.50% por 1 repetición extra
    }
  } else if (difference === 0) {
    // Cumplió exactamente el objetivo
    return currentTM;
  } else {
    // No alcanzó el objetivo - disminuir TM según las reglas de porcentaje
    if (difference <= -2) {
      return currentTM * 0.95; // -5.00% por 2+ repeticiones menos
    } else if (difference === -1) {
      return currentTM * 0.98; // -2.00% por 1 repetición menos
    }
  }

  return currentTM;
}

// Main function to generate the full 21-week program log
export function generateRepsToFailureProgram(
  config: RepsToFailureConfig,
  performance: UserPerformance[]
): RepsToFailureLog[] {
  const logs: RepsToFailureLog[] = [];
  let currentTM = config.initialWeight;

  for (let week = 1; week <= 21; week++) {
    const goalData = weeklyGoalData.find((g) => g.week === week)!;

    let action = `Using TM: ${currentTM.toFixed(1)}kg.`;
    if (week === 1) {
      action = `Starting TM: ${currentTM.toFixed(1)}kg.`;
    } else {
      const prevWeekPerf = performance.find((p) => p.week === week - 1);
      const prevGoalData = weeklyGoalData.find((g) => g.week === week - 1)!;
      if (prevWeekPerf && !prevGoalData.isDeload) {
        const repsDone = prevWeekPerf.repsOnLastSet;
        if (repsDone) {
          const newTM = calculateTMAdjustment(
            repsDone,
            prevGoalData.amrapTarget!,
            currentTM
          );
          const tmChange = newTM - currentTM;
          const tmChangePercent = (tmChange / currentTM) * 100;

          if (tmChange !== 0) {
            action = `Last week: ${repsDone}/${prevGoalData.amrapTarget!} reps. TM adjusted from ${currentTM.toFixed(
              1
            )} to ${newTM.toFixed(1)}kg (${
              tmChangePercent >= 0 ? '+' : ''
            }${tmChangePercent.toFixed(1)}%).`;
          } else {
            action = `Last week: ${repsDone}/${prevGoalData.amrapTarget!} reps. TM unchanged at ${currentTM.toFixed(
              1
            )}kg.`;
          }
          currentTM = newTM;
        }
      } else if (!prevGoalData.isDeload) {
        action = `TM unchanged at ${currentTM.toFixed(1)}kg. Waiting for W${
          week - 1
        } data.`;
      }
    }

    if (goalData.isDeload) {
      logs.push({
        week,
        tm: currentTM,
        weight: roundToNearest(currentTM * 0.6, 5),
        goal: '3x5 @ RPE 6',
        action: 'Deload Week',
      });
    } else {
      logs.push({
        week,
        tm: currentTM,
        weight: roundToNearest(currentTM * goalData.intensity!, 5),
        goal: `5x${goalData.reps!} (last set AMRAP ${goalData.amrapTarget!}+)`,
        action,
      });
    }
  }
  return logs;
}
