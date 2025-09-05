import { MuscleGroup } from '@/lib/api/types/exercise.type';

/**
 * Calculates volume contribution for a muscle group based on primary/secondary involvement
 * Primary muscles get full volume (1.0), secondary muscles get half volume (0.5)
 */
export function calculateMuscleVolume(
  sets: number,
  reps: number,
  weight: number,
  primaryMuscles: MuscleGroup[],
  secondaryMuscles: MuscleGroup[],
  targetMuscle: MuscleGroup
): number {
  const baseVolume = sets * reps * weight;
  
  if (primaryMuscles.includes(targetMuscle)) {
    return baseVolume * 1.0; // Full volume for primary muscles
  }
  
  if (secondaryMuscles.includes(targetMuscle)) {
    return baseVolume * 0.5; // Half volume for secondary muscles
  }
  
  return 0; // No volume if muscle not involved
}

/**
 * Calculates total volume for each muscle group from a list of exercises
 */
export function calculateTotalMuscleVolumes(exercises: {
  sets: number;
  reps: number;
  weight: number;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
}[]): Record<MuscleGroup, number> {
  const volumes: Record<MuscleGroup, number> = {} as Record<MuscleGroup, number>;
  
  // Initialize all muscle groups to 0
  Object.values(MuscleGroup).forEach(muscle => {
    volumes[muscle] = 0;
  });
  
  exercises.forEach(exercise => {
    Object.values(MuscleGroup).forEach(muscle => {
      volumes[muscle] += calculateMuscleVolume(
        exercise.sets,
        exercise.reps,
        exercise.weight,
        exercise.primaryMuscles,
        exercise.secondaryMuscles,
        muscle
      );
    });
  });
  
  return volumes;
}

/**
 * Calculates volume for a specific muscle group from routine day data
 */
export function calculateRoutineDayMuscleVolume(
  routineDay: {
    exercises: {
      exercise: {
        primaryMuscles: MuscleGroup[];
        secondaryMuscles: MuscleGroup[];
      };
      sets: {
        reps?: number | null;
        minReps?: number | null;
        maxReps?: number | null;
        weight?: number | null;
      }[];
    }[];
  },
  targetMuscle: MuscleGroup
): number {
  let totalVolume = 0;
  
  routineDay.exercises.forEach(routineExercise => {
    routineExercise.sets.forEach(set => {
      // Use average reps for range sets, or fixed reps
      const reps = set.reps ?? 
        (set.minReps && set.maxReps ? (set.minReps + set.maxReps) / 2 : 0);
      const weight = set.weight ?? 0;
      
      if (reps > 0 && weight > 0) {
        totalVolume += calculateMuscleVolume(
          1, // Individual set
          reps,
          weight,
          routineExercise.exercise.primaryMuscles,
          routineExercise.exercise.secondaryMuscles,
          targetMuscle
        );
      }
    });
  });
  
  return totalVolume;
}

/**
 * Gets all muscles involved in a routine day (primary + secondary)
 */
export function getInvolvedMuscles(routineDay: {
  exercises: {
    exercise: {
      primaryMuscles: MuscleGroup[];
      secondaryMuscles: MuscleGroup[];
    };
  }[];
}): MuscleGroup[] {
  const musclesSet = new Set<MuscleGroup>();
  
  routineDay.exercises.forEach(routineExercise => {
    routineExercise.exercise.primaryMuscles.forEach(muscle => musclesSet.add(muscle));
    routineExercise.exercise.secondaryMuscles.forEach(muscle => musclesSet.add(muscle));
  });
  
  return Array.from(musclesSet);
}
