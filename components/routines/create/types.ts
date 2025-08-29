export type RepType = 'FIXED' | 'RANGE';
export type ProgressionScheme = 'NONE' | 'DOUBLE_PROGRESSION' | 'DYNAMIC_DOUBLE_PROGRESSION';

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
}
