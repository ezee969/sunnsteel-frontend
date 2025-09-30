/**
 * RTF (Reps to Failure) related type definitions
 * Mirrors backend RTF week goals structure
 */

export type RtfVariant = 'STANDARD' | 'HYPERTROPHY';

/**
 * Individual RTF exercise goal for a specific week
 */
export interface RtfExerciseGoal {
  routineExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  variant: RtfVariant;
  week: number;
  isDeload: boolean;
  intensity: number;
  fixedReps: number;
  setsPlanned: number;
  amrapTarget: number | null;
  amrapSetNumber: number | null;
  workingWeightKg?: number;
  trainingMaxKg?: number;
}

/**
 * Complete RTF week goals response for a routine
 */
export interface RtfWeekGoals {
  routineId: string;
  week: number;
  withDeloads: boolean;
  goals: RtfExerciseGoal[];
  version: number;
  _cache?: 'HIT' | 'MISS';
}

/**
 * RTF timeline entry for a specific week
 */
export interface RtfTimelineEntry {
  week: number;
  isDeload: boolean;
  startDate: string; // ISO date
  endDate: string; // ISO date
}

/**
 * Complete RTF timeline response for a routine
 */
export interface RtfTimeline {
  routineId: string;
  totalWeeks: number;
  withDeloads: boolean;
  timeline: RtfTimelineEntry[];
  version: number;
  _cache?: 'HIT' | 'MISS';
}

/**
 * RTF forecast data for future performance prediction
 */
export interface RtfForecast {
  routineId: string;
  weeks: number;
  version: number;
  withDeloads: boolean;
  forecast: RtfForecastWeek[];
  _cache?: 'HIT' | 'MISS';
}

/**
 * Individual week in RTF forecast
 */
export interface RtfForecastWeek {
  week: number;
  isDeload: boolean;
  standard?: RtfForecastData;
  hypertrophy?: RtfForecastData;
}

/**
 * RTF forecast data for specific variant
 */
export interface RtfForecastData {
  intensity: number;
  fixedReps: number;
  amrapTarget: number;
  sets: number;
  amrapSet: number;
  isDeload?: boolean;
}