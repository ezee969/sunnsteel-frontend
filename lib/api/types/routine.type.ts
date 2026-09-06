// Re-export shared primitive enums to maintain backwards compatible imports.
export type { ProgressionScheme, RepType } from './routine.shared'
import type {
	CreateRoutineRequest as ContractCreateRoutineRequest,
	Routine as ContractRoutine,
	RoutineDay as ContractRoutineDay,
	RoutineExercise as ContractRoutineExercise,
	RoutineSet as ContractRoutineSet,
	UpdateRoutineRequest as ContractUpdateRoutineRequest,
} from '@sunsteel/contracts'

export type RoutineSet = ContractRoutineSet

export type RoutineExercise = ContractRoutineExercise

export type RoutineDay = ContractRoutineDay

export type Routine = ContractRoutine

// Request types
export type CreateRoutineRequest = ContractCreateRoutineRequest
export type UpdateRoutineRequest = ContractUpdateRoutineRequest
