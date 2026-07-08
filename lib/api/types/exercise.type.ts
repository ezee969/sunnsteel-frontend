import { MUSCLE_GROUPS } from '@sunsteel/contracts';
import type {
  Exercise as ContractExercise,
  MuscleGroup as ContractMuscleGroup,
} from '@sunsteel/contracts';

export type MuscleGroup = ContractMuscleGroup;

// Backwards-compatible runtime map so existing Object.values(MuscleGroup) usage
// keeps working while the canonical values come from shared contracts.
export const MuscleGroup: Record<MuscleGroup, MuscleGroup> = MUSCLE_GROUPS.reduce(
  (acc, muscle) => {
    acc[muscle] = muscle;
    return acc;
  },
  {} as Record<MuscleGroup, MuscleGroup>,
);

export type Exercise = ContractExercise
