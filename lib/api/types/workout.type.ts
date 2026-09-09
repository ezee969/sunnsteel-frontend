import type {
	FinishWorkoutRequest,
	FinishWorkoutResponse,
	ListSessionsParams,
	PaginatedResponse,
	PreviousPerformanceResponse,
	PreviousSetPerformance,
	ProgressionChange,
	SessionRecapRecord,
	SetLog as ContractSetLog,
	StartWorkoutRequest,
	UpsertSetLogRequest,
	UpsertSetLogResponse,
	WorkoutSession as ContractWorkoutSession,
	WorkoutSessionRecap,
	WorkoutSessionStatus,
	WorkoutSessionSummary as ContractWorkoutSessionSummary,
} from '@sunsteel/contracts'

export type SetLog = ContractSetLog

type ContractRoutineDay = NonNullable<ContractWorkoutSession['routineDay']>
type ContractRoutineExercise = ContractRoutineDay['exercises'][number]

type WorkoutRoutineExercise = Omit<ContractRoutineExercise, 'exercise'> & {
	exercise: ContractRoutineExercise['exercise'] & {
		equipment?: string | null
	}
}

export interface WorkoutSession extends Omit<
	ContractWorkoutSession,
	'routineDay'
> {
	routineDay?: Omit<ContractRoutineDay, 'exercises'> & {
		exercises: WorkoutRoutineExercise[]
	}
}

export type {
	FinishWorkoutRequest,
	FinishWorkoutResponse,
	PreviousPerformanceResponse,
	PreviousSetPerformance,
	ProgressionChange,
	SessionRecapRecord,
	StartWorkoutRequest,
	UpsertSetLogRequest,
	UpsertSetLogResponse,
	WorkoutSessionRecap,
}

// History/List types
export type WorkoutSessionListStatus = WorkoutSessionStatus

export type WorkoutSessionSummary = ContractWorkoutSessionSummary

export type { ListSessionsParams, PaginatedResponse }
