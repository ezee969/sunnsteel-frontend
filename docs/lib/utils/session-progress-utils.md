# Session Progress Utilities

## Overview

The session progress utilities provide functions for calculating workout session progress, exercise completion status, and organizing set logs for display in the workout session interface.

## Location

```
lib/utils/session-progress.utils.ts
```

## Key Functions

### `calculateSessionProgress(setLogs, exercises)`

Calculates the overall progress of a workout session based on completed sets.

**Parameters:**
- `setLogs: SetLog[]` - Array of set logs from the current session
- `exercises: RoutineExercise[]` - Array of exercises from the routine day

**Returns:**
```typescript
{
  totalSets: number;      // Total number of sets in the session
  completedSets: number;  // Number of completed sets
  percentage: number;     // Completion percentage (0-100)
}
```

**Usage:**
```typescript
import { calculateSessionProgress } from '@/lib/utils/session-progress.utils';

const progressData = calculateSessionProgress(setLogs, day.exercises);
console.log(`Progress: ${progressData.percentage}%`);
```

### `calculateExerciseCompletion(setLogs, exerciseId, totalSets)`

Calculates completion status for a specific exercise.

**Parameters:**
- `setLogs: SetLog[]` - Array of set logs
- `exerciseId: string` - ID of the exercise to check
- `totalSets: number` - Total number of sets for the exercise

**Returns:**
```typescript
{
  completedSets: number;  // Number of completed sets for this exercise
  totalSets: number;      // Total sets for this exercise
  percentage: number;     // Completion percentage for this exercise
  isComplete: boolean;    // Whether all sets are completed
}
```

### `areAllSetsCompleted(setLogs, exercises)`

Checks if all sets in the session are completed.

**Parameters:**
- `setLogs: SetLog[]` - Array of set logs
- `exercises: RoutineExercise[]` - Array of exercises from the routine day

**Returns:**
- `boolean` - True if all sets are completed

### `groupSetLogsByExercise(setLogs, exercises, sessionId)`

Groups set logs by exercise for display in the workout interface.

**Parameters:**
- `setLogs: SetLog[]` - Array of set logs
- `exercises: RoutineExercise[]` - Array of exercises from the routine day
- `sessionId: string` - ID of the current session

**Returns:**
```typescript
Array<{
  exerciseId: string;
  exerciseName: string;
  sets: Array<{
    setNumber: number;
    reps?: number;
    weight?: number;
    rpe?: number;
    isCompleted: boolean;
    // ... other set properties
  }>;
}>
```

## Type Dependencies

The utilities depend on the following types:

- `SetLog` from `@/lib/api/types/workout.type`
- `RoutineExercise` from `@/lib/api/types/routine.type`
- `SessionProgressData` from `@/lib/utils/workout-session.types`

## Integration Points

### Session Management Hook

The `useSessionManagement` hook uses `calculateSessionProgress` to provide real-time progress updates:

```typescript
const progressData = useMemo(() => {
  if (!routine || !routineDayId || !setLogs) {
    return { totalSets: 0, completedSets: 0, percentage: 0 };
  }
  
  const day = routine.days.find(d => d.id === routineDayId);
  if (!day) {
    return { totalSets: 0, completedSets: 0, percentage: 0 };
  }
  
  return calculateSessionProgress(setLogs, day.exercises);
}, [setLogs, routine, routineDayId]);
```

### Workout Components

Multiple workout components use the progress data:

- **SessionHeader**: Displays overall session progress
- **SessionActionCard**: Shows progress bar and completion status
- **SessionConfirmationDialog**: Uses progress for completion warnings
- **ExerciseGroup**: Shows individual exercise completion

## Recent Changes

### January 2025 Updates

1. **Fixed Import Issues**: Added missing `RoutineExercise` import from `@/lib/api/types/routine.type`

2. **Corrected Property Names**: Updated components to use `percentage` instead of `progressPercentage` from `SessionProgressData`

3. **Enhanced Type Safety**: Improved parameter validation and null checking in progress calculations

4. **Component Integration**: Fixed parameter passing in `useSessionManagement` hook to correctly call `calculateSessionProgress(setLogs, day.exercises)`

## Testing

The utilities include comprehensive unit tests covering:

- Progress calculation with various set completion states
- Exercise grouping and organization
- Edge cases with empty or invalid data
- Type safety and parameter validation

## Performance Considerations

- Functions use memoization where appropriate to prevent unnecessary recalculations
- Set log grouping is optimized for large exercise lists
- Progress calculations are lightweight and suitable for real-time updates

## Related Documentation

- [Workout Session Types](../workout-session-types.md)
- [Session Management Hook](../../hooks/use-session-management.md)
- [Workout Components](../../components/features/workout-session.md)

---

*Last Updated: January 2025*  
*This documentation reflects the recent fixes to import issues and property name corrections.*