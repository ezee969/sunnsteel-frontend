export type RepType = 'FIXED' | 'RANGE';

export interface RoutineSet {
  setNumber: number;
  repType: RepType;
  reps?: number | null;
  minReps?: number | null;
  maxReps?: number | null;
  weight?: number;
}

export interface RoutineExercise {
  id: string;
  order: number;
  restSeconds: number;
  exercise: {
    id: string;
    name: string;
  };
  sets: RoutineSet[];
}

export interface RoutineDay {
  id: string;
  dayOfWeek: number;
  order: number;
  exercises: RoutineExercise[];
}

export interface Routine {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPeriodized: boolean;
  isFavorite: boolean;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  days: RoutineDay[];
}

// Request types
export interface CreateRoutineRequest {
  name: string;
  description?: string;
  isPeriodized: boolean;
  days: Array<{
    dayOfWeek: number;
    exercises: Array<{
      exerciseId: string;
      restSeconds: number;
      sets: Array<
        | {
            setNumber: number;
            repType: 'FIXED';
            reps: number;
            weight?: number;
          }
        | {
            setNumber: number;
            repType: 'RANGE';
            minReps: number;
            maxReps: number;
            weight?: number;
          }
      >;
    }>;
  }>;
}
