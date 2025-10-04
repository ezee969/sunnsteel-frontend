import type { Routine, RoutineExercise } from '@/lib/api/types/routine.type';
import type { SetLog } from '@/lib/api/types/workout.type';
import type { SessionProgressData, ExerciseCompletionData } from './workout-session.types';

/**
 * Calculates overall session progress based on set logs and exercises
 * @param setLogs - Array of set logs from the session
 * @param exercises - Array of routine exercises
 * @returns Session progress data with totals and percentage
 */
export const calculateSessionProgress = (
  setLogs: SetLog[],
  exercises: RoutineExercise[]
): SessionProgressData => {
  if (!exercises || exercises.length === 0) {
    return { totalSets: 0, completedSets: 0, percentage: 0 };
  }

  const totalSets = exercises.reduce((acc, re) => acc + re.sets.length, 0);
  
  if (!setLogs || setLogs.length === 0) {
    return { totalSets, completedSets: 0, percentage: 0 };
  }

  const completedKeys = new Set(
    setLogs
      .filter((l) => l.isCompleted)
      .map((l) => `${l.routineExerciseId}-${l.setNumber}`)
  );

  const completedSets = exercises.reduce(
    (acc, re) =>
      acc +
      re.sets.filter((s) => completedKeys.has(`${re.id}-${s.setNumber}`)).length,
    0
  );

  const percentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  return { totalSets, completedSets, percentage };
};

/**
 * Calculates completion data for a specific exercise
 * @param setLogs - Array of set logs from the session
 * @param exercise - The routine exercise
 * @returns Exercise completion data
 */
export const calculateExerciseCompletion = (
  setLogs: SetLog[],
  exercise: RoutineExercise
): ExerciseCompletionData => {
  const completedSets = exercise.sets.filter((tpl) => {
    const log = setLogs.find(
      (l) => l.routineExerciseId === exercise.id && l.setNumber === tpl.setNumber
    );
    return log?.isCompleted;
  }).length;

  const totalSets = exercise.sets.length;
  const isCompleted = totalSets > 0 && completedSets === totalSets;
  const percentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  return {
    exerciseId: exercise.id,
    completedSets,
    totalSets,
    percentage,
    isCompleted,
  };
};

/**
 * Checks if all sets in the routine day are completed
 * Overloaded to support both test signature and original signature
 */
export function areAllSetsCompleted(
  setLogs: SetLog[],
  exercises: RoutineExercise[]
): boolean;
export function areAllSetsCompleted(
  routine: Routine | undefined,
  routineDayId: string,
  setLogs: SetLog[] | undefined
): boolean;
export function areAllSetsCompleted(
  routineOrSetLogs: Routine | undefined | SetLog[],
  routineDayIdOrExercises: string | RoutineExercise[],
  setLogs?: SetLog[]
): boolean {
  // Handle the overloaded case (setLogs, exercises)
  if (Array.isArray(routineOrSetLogs) && Array.isArray(routineDayIdOrExercises)) {
    const logs = routineOrSetLogs as SetLog[];
    const exercises = routineDayIdOrExercises as RoutineExercise[];
    
    // If no exercises, return true (vacuous truth)
    if (exercises.length === 0) return true;
    
    // If no set logs but there are exercises, return false
    if (logs.length === 0) return false;

    const completedSetLogs = new Set(
      logs
        .filter((l) => l.isCompleted)
        .map((l) => `${l.routineExerciseId}-${l.setNumber}`)
    );

    return exercises.every((re) =>
      re.sets.every((set) => completedSetLogs.has(`${re.id}-${set.setNumber}`))
    );
  }

  // Handle the original case (routine, routineDayId, setLogs)
  const routine = routineOrSetLogs as Routine | undefined;
  const routineDayId = routineDayIdOrExercises as string;
  const logs = setLogs as SetLog[] | undefined;

  if (!routine || !logs) return false;

  const day = routine.days.find((d) => d.id === routineDayId);
  if (!day) return false;

  const completedSetLogs = new Set(
    logs
      .filter((l) => l.isCompleted)
      .map((l) => `${l.routineExerciseId}-${l.setNumber}`)
  );

  return day.exercises.every((re) =>
    re.sets.every((set) => completedSetLogs.has(`${re.id}-${set.setNumber}`))
  );
};

/**
 * Group set logs by exercise for display
 */
export function groupSetLogsByExercise(
  setLogs: SetLog[],
  exercises: RoutineExercise[],
  sessionId: string
) {
  const sortedExercises = [...exercises].sort((a, b) => a.order - b.order);
  
  return sortedExercises.map((re) => {
    const templateSets = [...re.sets].sort((a, b) => a.setNumber - b.setNumber);
    
    const sets = templateSets.map((tpl) => {
      const log = setLogs.find(
        (l) => l.routineExerciseId === re.id && l.setNumber === tpl.setNumber
      );
      
      return {
        id: log?.id ?? `${re.id}-${tpl.setNumber}`,
        sessionId,
        routineExerciseId: re.id,
        exerciseId: re.exercise.id,
        setNumber: tpl.setNumber,
        reps: log?.reps ?? 0,
        weight: log?.weight ?? tpl.weight,
        isCompleted: log?.isCompleted ?? false,
        plannedReps: tpl.reps,
        plannedMinReps: tpl.minReps,
        plannedMaxReps: tpl.maxReps,
        plannedWeight: tpl.weight,
      };
    });

    return {
      exerciseId: re.id,
      exerciseName: re.exercise.name,
      sets,
    };
  });
}