# Exercise Service API

## Overview

The Exercise Service provides access to the exercise database, allowing retrieval of exercise information for routine creation and workout planning. This service is primarily read-only, focusing on exercise catalog operations.

## Base Configuration

```typescript
const EXERCISES_API_URL = '/exercises';
```

All endpoints require authentication via Supabase session token.

## Endpoints

### Get All Exercises

Retrieve the complete exercise database with all available exercises.

#### Request

```http
GET /exercises
```

#### Example Request

```typescript
const exercises = await exercisesService.getAll();
```

#### Response

```typescript
interface Exercise {
  id: string;
  name: string;
  description?: string;
  category: ExerciseCategory;
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  instructions?: string[];
  tips?: string[];
  variations?: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  isCompound: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ExerciseCategory {
  id: string;
  name: string;
  description?: string;
}

interface MuscleGroup {
  id: string;
  name: string;
  isPrimary: boolean;
}

interface Equipment {
  id: string;
  name: string;
  description?: string;
}

type Response = Exercise[];
```

#### Status Codes

- `200`: Success
- `401`: Unauthorized
- `500`: Internal Server Error

## Service Implementation

### TypeScript Service

```typescript
import { httpClient } from './httpClient';
import { Exercise } from '../types/exercise.type';

export const exercisesService = {
  /**
   * Get all exercises from the database
   * @returns Promise<Exercise[]> Complete list of exercises
   */
  async getAll(): Promise<Exercise[]> {
    return httpClient.request<Exercise[]>('/exercises', {
      method: 'GET',
      secure: true,
    });
  },
};
```

## Usage Patterns

### Basic Exercise Retrieval

```typescript
// Get all exercises for routine creation
const exercises = await exercisesService.getAll();

// Filter exercises by category
const strengthExercises = exercises.filter(
  exercise => exercise.category.name === 'Strength'
);

// Filter by muscle group
const chestExercises = exercises.filter(
  exercise => exercise.muscleGroups.some(
    group => group.name.toLowerCase().includes('chest')
  )
);
```

### Exercise Search and Filtering

```typescript
// Search exercises by name
const searchExercises = (exercises: Exercise[], query: string) => {
  const lowercaseQuery = query.toLowerCase();
  return exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(lowercaseQuery) ||
    exercise.description?.toLowerCase().includes(lowercaseQuery)
  );
};

// Filter by equipment
const bodyweightExercises = exercises.filter(
  exercise => exercise.equipment.some(
    eq => eq.name.toLowerCase() === 'bodyweight'
  )
);

// Filter by difficulty
const beginnerExercises = exercises.filter(
  exercise => exercise.difficulty === 'BEGINNER'
);
```

### Exercise Categorization

```typescript
// Group exercises by category
const exercisesByCategory = exercises.reduce((acc, exercise) => {
  const categoryName = exercise.category.name;
  if (!acc[categoryName]) {
    acc[categoryName] = [];
  }
  acc[categoryName].push(exercise);
  return acc;
}, {} as Record<string, Exercise[]>);

// Group by primary muscle group
const exercisesByMuscleGroup = exercises.reduce((acc, exercise) => {
  const primaryMuscles = exercise.muscleGroups.filter(mg => mg.isPrimary);
  primaryMuscles.forEach(muscle => {
    if (!acc[muscle.name]) {
      acc[muscle.name] = [];
    }
    acc[muscle.name].push(exercise);
  });
  return acc;
}, {} as Record<string, Exercise[]>);
```

## React Query Integration

### Hook Implementation

```typescript
import { useQuery } from '@tanstack/react-query';
import { exercisesService } from '../services/exercisesService';
import { usePerformanceQuery } from '@/hooks/use-performance-query';

export const useExercises = () => {
  return usePerformanceQuery({
    queryKey: ['exercises'],
    queryFn: exercisesService.getAll,
    staleTime: 1000 * 60 * 30, // 30 minutes - exercises rarely change
    gcTime: 1000 * 60 * 60, // 1 hour
  }, 'Exercises Load');
};
```

### Usage in Components

```typescript
import { useExercises } from '@/lib/api/hooks/useExercises';

function ExerciseSelector() {
  const { data: exercises, isLoading, error } = useExercises();

  if (isLoading) return <div>Loading exercises...</div>;
  if (error) return <div>Error loading exercises</div>;
  if (!exercises) return <div>No exercises found</div>;

  return (
    <div>
      {exercises.map(exercise => (
        <ExerciseCard key={exercise.id} exercise={exercise} />
      ))}
    </div>
  );
}
```

## Caching Strategy

### Long-term Caching

Since exercises rarely change, the service implements aggressive caching:

```typescript
// 30-minute stale time
staleTime: 1000 * 60 * 30

// 1-hour garbage collection time
gcTime: 1000 * 60 * 60
```

### Cache Invalidation

```typescript
// Invalidate exercises cache when needed
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Force refresh exercises
const refreshExercises = () => {
  queryClient.invalidateQueries({ queryKey: ['exercises'] });
};

// Prefetch exercises
const prefetchExercises = () => {
  queryClient.prefetchQuery({
    queryKey: ['exercises'],
    queryFn: exercisesService.getAll,
    staleTime: 1000 * 60 * 30,
  });
};
```

## Error Handling

### Service Error Handling

```typescript
try {
  const exercises = await exercisesService.getAll();
  return exercises;
} catch (error) {
  if (error.message.includes('401')) {
    // Handle authentication error
    console.error('Authentication required for exercises');
    throw new Error('Please log in to access exercises');
  } else if (error.message.includes('500')) {
    // Handle server error
    console.error('Server error loading exercises');
    throw new Error('Unable to load exercises. Please try again.');
  } else {
    // Handle network or other errors
    console.error('Network error:', error.message);
    throw new Error('Network error. Please check your connection.');
  }
}
```

### Component Error Handling

```typescript
function ExerciseList() {
  const { data: exercises, isLoading, error, refetch } = useExercises();

  if (error) {
    return (
      <div className="error-container">
        <p>Failed to load exercises: {error.message}</p>
        <button onClick={() => refetch()}>
          Try Again
        </button>
      </div>
    );
  }

  // ... rest of component
}
```

## Performance Optimization

### Exercise Lookup Optimization

```typescript
// Create lookup map for O(1) exercise access
const useExerciseLookup = (exercises?: Exercise[]) => {
  return useMemo(() => {
    if (!exercises) return {};
    return exercises.reduce((acc, exercise) => {
      acc[exercise.id] = exercise;
      return acc;
    }, {} as Record<string, Exercise>);
  }, [exercises]);
};

// Usage in components
function RoutineBuilder() {
  const { data: exercises } = useExercises();
  const exerciseLookup = useExerciseLookup(exercises);

  const getExercise = (id: string) => exerciseLookup[id];
  
  // ... component logic
}
```

### Filtered Exercise Lists

```typescript
// Memoized filtering for performance
const useFilteredExercises = (
  exercises?: Exercise[],
  filters: {
    category?: string;
    muscleGroup?: string;
    equipment?: string;
    difficulty?: string;
    search?: string;
  } = {}
) => {
  return useMemo(() => {
    if (!exercises) return [];

    return exercises.filter(exercise => {
      // Category filter
      if (filters.category && exercise.category.name !== filters.category) {
        return false;
      }

      // Muscle group filter
      if (filters.muscleGroup) {
        const hasTargetMuscle = exercise.muscleGroups.some(
          mg => mg.name === filters.muscleGroup
        );
        if (!hasTargetMuscle) return false;
      }

      // Equipment filter
      if (filters.equipment) {
        const hasEquipment = exercise.equipment.some(
          eq => eq.name === filters.equipment
        );
        if (!hasEquipment) return false;
      }

      // Difficulty filter
      if (filters.difficulty && exercise.difficulty !== filters.difficulty) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = exercise.name.toLowerCase().includes(searchLower);
        const matchesDescription = exercise.description?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesDescription) return false;
      }

      return true;
    });
  }, [exercises, filters]);
};
```

## Testing

### Service Testing

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exercisesService } from './exercisesService';
import { httpClient } from './httpClient';

vi.mock('./httpClient');

describe('exercisesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch all exercises', async () => {
    const mockExercises = [
      {
        id: '1',
        name: 'Bench Press',
        category: { id: '1', name: 'Strength' },
        muscleGroups: [{ id: '1', name: 'Chest', isPrimary: true }],
        equipment: [{ id: '1', name: 'Barbell' }],
        difficulty: 'INTERMEDIATE',
        isCompound: true
      }
    ];

    vi.mocked(httpClient.request).mockResolvedValue(mockExercises);

    const result = await exercisesService.getAll();

    expect(result).toEqual(mockExercises);
    expect(httpClient.request).toHaveBeenCalledWith('/exercises', {
      method: 'GET',
      secure: true,
    });
  });

  it('should handle errors gracefully', async () => {
    const errorMessage = 'Network error';
    vi.mocked(httpClient.request).mockRejectedValue(new Error(errorMessage));

    await expect(exercisesService.getAll()).rejects.toThrow(errorMessage);
  });
});
```

### Hook Testing

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useExercises } from './useExercises';
import { exercisesService } from '../services/exercisesService';

vi.mock('../services/exercisesService');

describe('useExercises', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should fetch exercises successfully', async () => {
    const mockExercises = [{ id: '1', name: 'Test Exercise' }];
    vi.mocked(exercisesService.getAll).mockResolvedValue(mockExercises);

    const { result } = renderHook(() => useExercises(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockExercises);
    expect(result.current.error).toBeNull();
  });
});
```

## Integration Examples

### Routine Builder Integration

```typescript
function RoutineExerciseSelector({ onExerciseSelect }: Props) {
  const { data: exercises, isLoading } = useExercises();
  const [filters, setFilters] = useState({
    category: '',
    muscleGroup: '',
    search: ''
  });

  const filteredExercises = useFilteredExercises(exercises, filters);

  if (isLoading) {
    return <ExercisesSkeleton />;
  }

  return (
    <div>
      <ExerciseFilters 
        filters={filters} 
        onFiltersChange={setFilters} 
      />
      <ExerciseGrid 
        exercises={filteredExercises}
        onExerciseSelect={onExerciseSelect}
      />
    </div>
  );
}
```

### Workout Session Integration

```typescript
function WorkoutExerciseDisplay({ exerciseId }: Props) {
  const { data: exercises } = useExercises();
  const exerciseLookup = useExerciseLookup(exercises);
  
  const exercise = exerciseLookup[exerciseId];

  if (!exercise) {
    return <div>Exercise not found</div>;
  }

  return (
    <div>
      <h3>{exercise.name}</h3>
      <p>{exercise.description}</p>
      <div>
        <strong>Primary Muscles:</strong>
        {exercise.muscleGroups
          .filter(mg => mg.isPrimary)
          .map(mg => mg.name)
          .join(', ')
        }
      </div>
      {exercise.instructions && (
        <div>
          <strong>Instructions:</strong>
          <ol>
            {exercise.instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
```

## Future Enhancements

### Potential API Extensions

```typescript
// Future endpoint possibilities
interface ExerciseServiceExtensions {
  // Get exercises by category
  getByCategory(categoryId: string): Promise<Exercise[]>;
  
  // Get exercises by muscle group
  getByMuscleGroup(muscleGroupId: string): Promise<Exercise[]>;
  
  // Search exercises with advanced filters
  search(params: ExerciseSearchParams): Promise<Exercise[]>;
  
  // Get exercise details with related exercises
  getWithRelated(id: string): Promise<ExerciseWithRelated>;
}

interface ExerciseSearchParams {
  query?: string;
  categories?: string[];
  muscleGroups?: string[];
  equipment?: string[];
  difficulty?: string[];
  isCompound?: boolean;
  limit?: number;
  offset?: number;
}
```

## Related Documentation

- [Routine Service](./routines.md) - For routine creation using exercises
- [Workout Service](./workouts.md) - For workout sessions with exercises
- [API Types](../types/exercise-types.md) - Type definitions
- [React Query Hooks](../../hooks/api-hooks/use-exercises.md) - Hook usage patterns
- [Authentication](../authentication.md) - Authentication requirements

---

*For implementation details and advanced usage patterns, refer to the source code in `lib/api/services/exercisesService.ts`.*