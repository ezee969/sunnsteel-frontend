import type { Routine } from '@/lib/api/types/routine.type';
import type { ProgressionScheme } from '@/lib/api/types/routine.shared'
import type { SetLog } from '@/lib/api/types/workout.type';

export type UpsertSetLogPayload = {
  routineExerciseId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight?: number;
  isCompleted?: boolean;
};

export type LogRowProps = {
  sessionId: string;
  routineExerciseId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight?: number;
  rpe?: number;
  isCompleted: boolean;
  plannedReps?: number | null;
  plannedMinReps?: number | null;
  plannedMaxReps?: number | null;
  plannedWeight?: number | null;
  onSave: (payload: UpsertSetLogPayload) => void;
};

export type GroupedLogsProps = {
  logs: Array<{
    id: string;
    routineExerciseId: string;
    exerciseId: string;
    setNumber: number;
    reps: number;
    weight?: number;
    rpe?: number;
    isCompleted: boolean;
  }>;
  routineId: string;
  routineDayId: string;
  routine: Routine;
  sessionId: string;
  onSave: LogRowProps['onSave'];
};

export type SessionStatus = 'COMPLETED' | 'ABORTED';

export type SessionProgressData = {
  totalSets: number;
  completedSets: number;
  percentage: number;
};

export type ExerciseCompletionData = {
  exerciseId: string;
  completedSets: number;
  totalSets: number;
  percentage: number;
  isCompleted: boolean;
};

// Grouped exercise logs used by the Active Session page
export type GroupedExerciseLogs = {
  exerciseId: string
  exerciseName: string
  sets: Array<{
    id: string
    sessionId: string
    routineExerciseId: string
    exerciseId: string
    setNumber: number
    reps: number
    weight?: number
    rpe?: number
    isCompleted: boolean
    plannedReps?: number | null
    plannedMinReps?: number | null
    plannedMaxReps?: number | null
    plannedWeight?: number | null
  }>
  progressionScheme: ProgressionScheme
  programStyle?: 'STANDARD' | 'HYPERTROPHY'
}