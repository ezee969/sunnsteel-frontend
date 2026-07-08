import type {
  FinishWorkoutRequest,
  ListSessionsParams,
  PaginatedResponse,
  SetLog as ContractSetLog,
  StartWorkoutRequest,
  UpsertSetLogRequest,
  WorkoutSession as ContractWorkoutSession,
  WorkoutSessionStatus,
  WorkoutSessionSummary as ContractWorkoutSessionSummary,
} from '@sunsteel/contracts'

export type SetLog = ContractSetLog

type ContractRoutineDay = NonNullable<ContractWorkoutSession['routineDay']
>;
type ContractRoutineExercise = ContractRoutineDay['exercises'][number];

type WorkoutRoutineExercise = Omit<ContractRoutineExercise, 'exercise'> & {
  exercise: ContractRoutineExercise['exercise'] & {
    equipment?: string | null;
  };
};

export interface WorkoutSession
  extends Omit<ContractWorkoutSession, 'routineDay'> {
  routineDay?: Omit<ContractRoutineDay, 'exercises'> & {
    exercises: WorkoutRoutineExercise[];
  };
}

export type {
  FinishWorkoutRequest,
  StartWorkoutRequest,
  UpsertSetLogRequest,
}

// History/List types
export type WorkoutSessionListStatus = WorkoutSessionStatus

export type WorkoutSessionSummary = ContractWorkoutSessionSummary

export type { ListSessionsParams, PaginatedResponse }
