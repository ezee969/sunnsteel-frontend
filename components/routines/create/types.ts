export type RepType = 'FIXED' | 'RANGE';
export type ProgressionScheme =
  | 'NONE'
  | 'DOUBLE_PROGRESSION'
  | 'DYNAMIC_DOUBLE_PROGRESSION'
  | 'PROGRAMMED_RTF'
  | 'PROGRAMMED_RTF_HYPERTROPHY';

export interface RoutineWizardData {
  name: string;
  description?: string;
  trainingDays: number[];
  days: Array<{
    dayOfWeek: number;
    exercises: Array<{
      exerciseId: string;
      progressionScheme: ProgressionScheme;
      minWeightIncrement: number;
      // RtF-specific when progressionScheme = PROGRAMMED_RTF
      programTMKg?: number;
      programRoundingKg?: number; // 0.5 | 1.0 | 2.5 | 5.0
      sets: Array<{
        setNumber: number;
        repType: RepType;
        reps?: number | null;
        minReps?: number | null;
        maxReps?: number | null;
        weight?: number;
      }>;
      restSeconds: number;
    }>;
  }>;
  // Program schedule mode: TIMEFRAME (date-driven) or NONE (indefinite)
  programScheduleMode?: 'TIMEFRAME' | 'NONE';
  // Routine-level program settings (only used if any exercise is PROGRAMMED_RTF)
  programWithDeloads?: boolean; // true=21; false=18
  programStartDate?: string; // yyyy-mm-dd (local date)
  programTimezone?: string; // IANA tz
  programStartWeek?: number; // 1..(18|21) only in create flow; default 1
}
