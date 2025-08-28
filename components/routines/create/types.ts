export type RepType = 'FIXED' | 'RANGE';

export interface RoutineWizardData {
  name: string;
  description?: string;
  trainingDays: number[];
  days: Array<{
    dayOfWeek: number;
    exercises: Array<{
      exerciseId: string;
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
