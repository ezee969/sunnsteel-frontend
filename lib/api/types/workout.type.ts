import type { ProgressionScheme } from './routine.shared';
import type { RepType, WorkoutSessionStatus } from '@sunsteel/contracts'
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
  lastActivityAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // When fetched with includeLogs=true on backend select
  setLogs?: SetLog[];
  // Optional RtF program info returned by start endpoint (and may be present on detail views)
  program?: {
    currentWeek: number;
    durationWeeks: number;
    withDeloads: boolean;
    isDeloadWeek: boolean;
    startDate: string;
    endDate: string;
    timeZone: string;
  };
  // Optional day plans for RtF exercises
  rtfPlans?: unknown[];
  // Indicates whether backend reused an existing active session on start
  reused?: boolean;
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
      progressionScheme: ProgressionScheme;
      minWeightIncrement: number;
      exercise: {
        id: string;
        name: string;
        primaryMuscles: string[];
        secondaryMuscles?: string[];
        equipment?: string | null;
      };
      sets: {
        id: string;
        setNumber: number;
        repType: RepType;
        reps?: number | null;
        minReps?: number | null;
        maxReps?: number | null;
        weight?: number | null;
      }[];
    }[];
  };
}

export type {
	FinishWorkoutRequest,
	StartWorkoutRequest,
	UpsertSetLogRequest,
} from '@sunsteel/contracts'

// History/List types
export type WorkoutSessionListStatus = WorkoutSessionStatus

export interface WorkoutSessionSummary {
  id: string;
  status: WorkoutSessionStatus;
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

export type { ListSessionsParams, PaginatedResponse } from '@sunsteel/contracts'
