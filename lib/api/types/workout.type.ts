export interface SetLog {
  id: string;
  sessionId: string;
  routineExerciseId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight?: number;
  rpe?: number;
  isCompleted: boolean;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type WorkoutSessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED';

export interface WorkoutSession {
  id: string;
  userId: string;
  routineId: string;
  routineDayId: string;
  status: WorkoutSessionStatus;
  startedAt: string;
  endedAt?: string | null;
  durationSec?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  // When fetched with includeLogs=true on backend select
  setLogs?: SetLog[];
  // Detailed session data
  routine?: {
    id: string;
    name: string;
    description?: string | null;
  };
  routineDay?: {
    id: string;
    name?: string;
    order?: number;
    dayOfWeek?: number;
    exercises: {
      id: string;
      order: number;
      restSeconds?: number | null;
      progressionScheme: 'DYNAMIC' | 'DYNAMIC_DOUBLE';
      minWeightIncrement: number;
      exercise: {
        id: string;
        name: string;
        primaryMuscles: string[];
        secondaryMuscles: string[];
        equipment?: string | null;
      };
      sets: {
        id: string;
        setNumber: number;
        repType: 'FIXED' | 'RANGE';
        reps?: number | null;
        minReps?: number | null;
        maxReps?: number | null;
        weight?: number | null;
      }[];
    }[];
  };
}

export interface StartWorkoutRequest {
  routineId: string;
  routineDayId: string;
  notes?: string;
}

export type FinishStatus = 'COMPLETED' | 'ABORTED';

export interface FinishWorkoutRequest {
  status: FinishStatus;
  notes?: string;
}

export interface UpsertSetLogRequest {
  routineExerciseId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight?: number;
  rpe?: number;
  isCompleted?: boolean;
}

// History/List types
export type WorkoutSessionListStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED';

export interface WorkoutSessionSummary {
  id: string;
  status: WorkoutSessionListStatus;
  startedAt: string;
  endedAt?: string | null;
  durationSec?: number | null;
  totalVolume?: number | null;
  totalSets?: number | null;
  totalExercises?: number | null;
  notes?: string | null;
  routine: {
    id: string;
    name: string;
    dayName?: string | null;
  };
}

export interface ListSessionsParams {
  status?: WorkoutSessionListStatus;
  routineId?: string;
  from?: string; // ISO date
  to?: string; // ISO date
  q?: string;
  cursor?: string;
  limit?: number;
  sort?: 'finishedAt:desc' | 'finishedAt:asc' | 'startedAt:desc' | 'startedAt:asc';
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
}
