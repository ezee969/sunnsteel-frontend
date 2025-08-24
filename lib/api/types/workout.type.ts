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
