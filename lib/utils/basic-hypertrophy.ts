export interface BasicHypertrophyConfig {
  initialSets: number;
  finalSets: number;
  initialReps: number;
  finalReps: number;
  setIncrement: number;
  repIncrement: number;
  loadIncrement: number; // Percentage
  roundingIncrement: number; // kg or lbs
  initialWeight?: number;
}

export interface WeeklyLog {
  week: number;
  goal: string;
  completed: boolean;
  action: string;
  weight: number | null;
}

export interface HypertrophyPerformance {
    week: number;
    completed: boolean | null; // null = no state, true = completed, false = not completed
    weight?: number;
}

export function createInitialBasicHypertrophyConfig(
  customConfig?: {
    initialSets?: number;
    finalSets?: number;
    initialReps?: number;
    finalReps?: number;
    setIncrement?: number;
    repIncrement?: number;
    initialWeight?: number;
  }
): BasicHypertrophyConfig {
  return {
    initialSets: customConfig?.initialSets ?? 3,
    finalSets: customConfig?.finalSets ?? 4,
    initialReps: customConfig?.initialReps ?? 6,
    finalReps: customConfig?.finalReps ?? 10,
    setIncrement: customConfig?.setIncrement ?? 1,
    repIncrement: customConfig?.repIncrement ?? 1,
    loadIncrement: 2.5, // Percentage
    roundingIncrement: 2.5, // kg or lbs
    initialWeight: customConfig?.initialWeight,
  };
}

function roundToNearest(value: number, increment: number): number {
  if (increment === 0) return value;
  if (increment === 0.1) return Math.round(value * 10) / 10;
  return Math.round(value / increment) * increment;
}

export function generateBasicHypertrophyProgram(config: BasicHypertrophyConfig, userPerformance: HypertrophyPerformance[]) {
  const progressionLog: WeeklyLog[] = [];

  const week1Performance = userPerformance.find(p => p.week === 1);
  let currentWeight = week1Performance?.weight || config.initialWeight || 0;

  let currentSets = config.initialSets;
  let currentReps = config.initialReps;

  for (let week = 1; week <= 21; week++) {
    const isDeloadWeek = [7, 14, 21].includes(week);
    const performanceInput = userPerformance.find(p => p.week === week);
    const completed = performanceInput?.completed || false;

    let displayWeight: number | null = null;
    let goalString: string;

    if (isDeloadWeek) {
      displayWeight = roundToNearest(currentWeight * 0.8, config.roundingIncrement);
      goalString = `4x5 @ ${displayWeight}kg`;
    } else {
      if (week === 1) {
        displayWeight = performanceInput?.weight || config.initialWeight || null;
      } else {
        displayWeight = roundToNearest(currentWeight, config.roundingIncrement);
      }
      goalString = displayWeight ? `${currentSets}x${currentReps} @ ${displayWeight}kg` : `${currentSets}x${currentReps}`;
    }

    const logEntry: WeeklyLog = {
      week,
      goal: goalString,
      completed,
      action: '',
      weight: displayWeight,
    };

    if (isDeloadWeek) {
      logEntry.action = 'Deload week. Progression pauses.';
    } else if (!displayWeight && week === 1) {
      logEntry.action = 'Set initial weight to begin.';
    } else if (completed) {
      if (week === 1 && performanceInput?.weight) {
        currentWeight = performanceInput.weight;
      }

      logEntry.completed = true;
      if (currentSets < config.finalSets) {
        currentSets += config.setIncrement;
        logEntry.action = `Sets +1. Next: ${currentSets}x${currentReps}.`;
      } else if (currentReps < config.finalReps) {
        currentSets = config.initialSets;
        currentReps += config.repIncrement;
        logEntry.action = `Reps +1. Next: ${currentSets}x${currentReps}.`;
      } else {
        const lastUsedWeight = displayWeight!;
        currentSets = config.initialSets;
        currentReps = config.initialReps;
        const theoreticalNewWeight = lastUsedWeight * (1 + config.loadIncrement / 100);
        let nextWeight = roundToNearest(theoreticalNewWeight, config.roundingIncrement);
        if (nextWeight <= lastUsedWeight) {
          nextWeight = lastUsedWeight + config.roundingIncrement;
        }
        currentWeight = nextWeight;

        displayWeight = roundToNearest(currentWeight, config.roundingIncrement);
        goalString = `${currentSets}x${currentReps} @ ${displayWeight}kg`;
        logEntry.weight = displayWeight;
        logEntry.goal = goalString;

        logEntry.action = `Weight +. Next: ${currentSets}x${currentReps} @ ~${currentWeight.toFixed(1)}kg.`;
      }
    } else {
      if (!week1Performance?.weight && !config.initialWeight) {
        logEntry.action = 'Set initial weight to begin.';
      } else {
        logEntry.action = '-';
      }
    }

    progressionLog.push(logEntry);
  }

  return progressionLog;
}