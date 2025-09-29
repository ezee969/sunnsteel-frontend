# TM Adjustment Service API

## Overview

The TM Adjustment Service manages Training Max (TM) adjustments for PROGRAMMED_RTF routines in the Sunsteel fitness application. This service allows users to track and manage changes to their training maxes based on performance feedback, providing detailed analytics and progression tracking.

## Base Configuration

```typescript
const TM_EVENTS_API_URL = '/routines/{routineId}/tm-events';
```

All endpoints require authentication via Supabase session token and are specific to PROGRAMMED_RTF routine types.

## Endpoints

### Create TM Adjustment

Create a new Training Max adjustment for a specific exercise within a routine.

#### Request

```http
POST /routines/{routineId}/tm-events
```

#### Request Body

```typescript
interface CreateTmEventRequest {
  exerciseId: string;
  weekNumber: number;
  deltaKg: number;
  preTmKg: number;
  postTmKg: number;
  reason?: string;
}
```

#### Example Request

```typescript
const adjustment = await TmAdjustmentService.createTmAdjustment('routine-123', {
  exerciseId: 'exercise-456',
  weekNumber: 3,
  deltaKg: 2.5,
  preTmKg: 100,
  postTmKg: 102.5,
  reason: 'Completed all reps with excellent form'
});
```

#### Response

```typescript
interface TmEventResponse {
  id: string;
  routineId: string;
  exerciseId: string;
  exerciseName: string;
  weekNumber: number;
  deltaKg: number;
  preTmKg: number;
  postTmKg: number;
  reason?: string;
  style: 'STANDARD' | 'HYPERTROPHY' | null;
  createdAt: string;
}
```

#### Status Codes

- `201`: Created successfully
- `400`: Invalid request data
- `401`: Unauthorized
- `404`: Routine not found
- `500`: Internal Server Error

### Get TM Adjustments

Retrieve TM adjustments for a routine with optional filtering parameters.

#### Request

```http
GET /routines/{routineId}/tm-events?exerciseId={exerciseId}&minWeek={minWeek}&maxWeek={maxWeek}
```

#### Query Parameters

```typescript
interface GetTmAdjustmentsParams {
  exerciseId?: string;  // Filter by specific exercise
  minWeek?: number;     // Minimum week number
  maxWeek?: number;     // Maximum week number
}
```

#### Example Request

```typescript
// Get all adjustments for a routine
const allAdjustments = await TmAdjustmentService.getTmAdjustments('routine-123');

// Get adjustments for specific exercise
const exerciseAdjustments = await TmAdjustmentService.getTmAdjustments('routine-123', {
  exerciseId: 'exercise-456'
});

// Get adjustments for specific week range
const weekRangeAdjustments = await TmAdjustmentService.getTmAdjustments('routine-123', {
  minWeek: 1,
  maxWeek: 5
});
```

#### Response

```typescript
type Response = TmEventResponse[];
```

#### Status Codes

- `200`: Success
- `401`: Unauthorized
- `404`: Routine not found
- `500`: Internal Server Error

### Get TM Adjustment Summary

Retrieve summary statistics for TM adjustments across all exercises in a routine.

#### Request

```http
GET /routines/{routineId}/tm-events/summary
```

#### Example Request

```typescript
const summary = await TmAdjustmentService.getTmAdjustmentSummary('routine-123');
```

#### Response

```typescript
interface TmEventSummary {
  exerciseId: string;
  exerciseName: string;
  totalDeltaKg: number;
  averageDeltaKg: number;
  adjustmentCount: number;
  lastAdjustmentDate: string | null;
}

type Response = TmEventSummary[];
```

#### Status Codes

- `200`: Success
- `401`: Unauthorized
- `404`: Routine not found
- `500`: Internal Server Error

## Service Implementation

### TypeScript Service Class

```typescript
import { httpClient } from './httpClient';
import {
  CreateTmEventRequest,
  TmEventResponse,
  TmEventSummary,
  GetTmAdjustmentsParams,
} from '../types/tm-adjustment.types';

export class TmAdjustmentService {
  /**
   * Create a new TM adjustment for a routine
   */
  static async createTmAdjustment(
    routineId: string,
    data: CreateTmEventRequest
  ): Promise<TmEventResponse> {
    return httpClient.request<TmEventResponse>(
      `/routines/${routineId}/tm-events`,
      {
        method: 'POST',
        body: JSON.stringify(data),
        secure: true,
      }
    );
  }

  /**
   * Get TM adjustments for a routine with optional filtering
   */
  static async getTmAdjustments(
    routineId: string,
    params?: GetTmAdjustmentsParams
  ): Promise<TmEventResponse[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.exerciseId) {
      searchParams.append('exerciseId', params.exerciseId);
    }
    if (params?.minWeek !== undefined) {
      searchParams.append('minWeek', params.minWeek.toString());
    }
    if (params?.maxWeek !== undefined) {
      searchParams.append('maxWeek', params.maxWeek.toString());
    }

    const queryString = searchParams.toString();
    const url = `/routines/${routineId}/tm-events${queryString ? `?${queryString}` : ''}`;

    return httpClient.request<TmEventResponse[]>(url, {
      method: 'GET',
      secure: true,
    });
  }

  /**
   * Get summary statistics for TM adjustments in a routine
   */
  static async getTmAdjustmentSummary(routineId: string): Promise<TmEventSummary[]> {
    return httpClient.request<TmEventSummary[]>(
      `/routines/${routineId}/tm-events/summary`,
      {
        method: 'GET',
        secure: true,
      }
    );
  }
}
```

## Validation Constants

### TM Adjustment Constraints

```typescript
export const TM_ADJUSTMENT_CONSTANTS = {
  MAX_DELTA_KG: 15,        // Warning threshold for large adjustments
  MIN_DELTA_KG: -15,       // Minimum allowed delta
  MIN_WEEK: 1,             // Minimum week number
  MAX_WEEK: 21,            // Maximum week number (21-week program)
  MAX_REASON_LENGTH: 160   // Maximum reason text length
} as const;
```

### Validation Schema

```typescript
import { z } from 'zod';

const createTmEventSchema = z.object({
  exerciseId: z.string().min(1, 'Exercise is required'),
  weekNumber: z.number()
    .int()
    .min(TM_ADJUSTMENT_CONSTANTS.MIN_WEEK)
    .max(TM_ADJUSTMENT_CONSTANTS.MAX_WEEK),
  deltaKg: z.number()
    .min(TM_ADJUSTMENT_CONSTANTS.MIN_DELTA_KG)
    .max(TM_ADJUSTMENT_CONSTANTS.MAX_DELTA_KG),
  preTmKg: z.number().min(1, 'Training Max must be positive'),
  postTmKg: z.number().min(1, 'New Training Max must be positive'),
  reason: z.string()
    .max(TM_ADJUSTMENT_CONSTANTS.MAX_REASON_LENGTH)
    .optional(),
}).refine((data) => {
  return Math.abs(data.preTmKg + data.deltaKg - data.postTmKg) < 0.01;
}, {
  message: 'Delta calculation error: preTmKg + deltaKg must equal postTmKg',
  path: ['postTmKg'],
});
```

## React Query Integration

### Query Key Factory

```typescript
export const tmAdjustmentKeys = {
  all: ['tm-adjustments'] as const,
  routines: () => [...tmAdjustmentKeys.all, 'routines'] as const,
  routine: (routineId: string) => [...tmAdjustmentKeys.routines(), routineId] as const,
  adjustments: (routineId: string, params?: GetTmAdjustmentsParams) => 
    [...tmAdjustmentKeys.routine(routineId), 'adjustments', params] as const,
  summary: (routineId: string) => 
    [...tmAdjustmentKeys.routine(routineId), 'summary'] as const,
};
```

### Hook Implementations

#### Get TM Adjustments Hook

```typescript
export const useGetTmAdjustments = (
  routineId: string,
  params?: GetTmAdjustmentsParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: tmAdjustmentKeys.adjustments(routineId, params),
    queryFn: () => TmAdjustmentService.getTmAdjustments(routineId, params),
    enabled: options?.enabled ?? !!routineId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

#### Get TM Summary Hook

```typescript
export const useGetTmAdjustmentSummary = (
  routineId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: tmAdjustmentKeys.summary(routineId),
    queryFn: () => TmAdjustmentService.getTmAdjustmentSummary(routineId),
    enabled: options?.enabled ?? !!routineId,
    staleTime: 10 * 60 * 1000, // 10 minutes - summaries change less frequently
  });
};
```

#### Create TM Adjustment Hook

```typescript
export const useCreateTmAdjustment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ routineId, data }: { routineId: string; data: CreateTmEventRequest }) =>
      TmAdjustmentService.createTmAdjustment(routineId, data),
    onSuccess: (newAdjustment: TmEventResponse) => {
      const { routineId } = newAdjustment;

      // Invalidate all TM adjustment queries for this routine
      queryClient.invalidateQueries({
        queryKey: tmAdjustmentKeys.routine(routineId),
      });

      // Optimistic update for immediate feedback
      queryClient.setQueryData<TmEventResponse[]>(
        tmAdjustmentKeys.adjustments(routineId),
        (oldData) => {
          if (!oldData) return [newAdjustment];
          return [newAdjustment, ...oldData];
        }
      );
    },
    onError: (error) => {
      console.error('Failed to create TM adjustment:', error);
    },
  });
};
```

## Usage Patterns

### Basic TM Adjustment Creation

```typescript
function TmAdjustmentForm({ routineId, exerciseId }: Props) {
  const createMutation = useCreateTmAdjustment();
  
  const handleSubmit = async (data: CreateTmEventRequest) => {
    try {
      await createMutation.mutateAsync({
        routineId,
        data: {
          exerciseId,
          weekNumber: 3,
          deltaKg: 2.5,
          preTmKg: 100,
          postTmKg: 102.5,
          reason: 'Completed all reps with good form'
        }
      });
    } catch (error) {
      console.error('Failed to create adjustment:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### TM Adjustment Analytics

```typescript
function TmProgressChart({ routineId, exerciseId }: Props) {
  const { data: adjustments } = useGetTmAdjustments(routineId, { exerciseId });
  const { data: summary } = useGetTmAdjustmentSummary(routineId);

  const exerciseSummary = summary?.find(s => s.exerciseId === exerciseId);

  if (!adjustments || !exerciseSummary) {
    return <div>Loading TM data...</div>;
  }

  return (
    <div>
      <h3>Training Max Progress</h3>
      <div>
        <p>Total Adjustments: {exerciseSummary.adjustmentCount}</p>
        <p>Total Change: {exerciseSummary.totalDeltaKg}kg</p>
        <p>Average Change: {exerciseSummary.averageDeltaKg}kg</p>
      </div>
      
      {/* Chart component showing TM progression */}
      <TmChart adjustments={adjustments} />
    </div>
  );
}
```

### Filtered TM History

```typescript
function TmAdjustmentHistory({ routineId }: Props) {
  const [weekRange, setWeekRange] = useState({ min: 1, max: 21 });
  const [selectedExercise, setSelectedExercise] = useState<string>('');

  const { data: adjustments, isLoading } = useGetTmAdjustments(routineId, {
    exerciseId: selectedExercise || undefined,
    minWeek: weekRange.min,
    maxWeek: weekRange.max
  });

  if (isLoading) return <div>Loading adjustments...</div>;

  return (
    <div>
      <div className="filters">
        <WeekRangeSelector value={weekRange} onChange={setWeekRange} />
        <ExerciseSelector value={selectedExercise} onChange={setSelectedExercise} />
      </div>
      
      <div className="adjustments-list">
        {adjustments?.map(adjustment => (
          <TmAdjustmentCard key={adjustment.id} adjustment={adjustment} />
        ))}
      </div>
    </div>
  );
}
```

## Error Handling

### Service Error Handling

```typescript
try {
  const adjustment = await TmAdjustmentService.createTmAdjustment(routineId, data);
  return adjustment;
} catch (error) {
  if (error.message.includes('400')) {
    // Handle validation errors
    throw new Error('Invalid adjustment data. Please check your inputs.');
  } else if (error.message.includes('404')) {
    // Handle routine not found
    throw new Error('Routine not found or not accessible.');
  } else if (error.message.includes('401')) {
    // Handle authentication error
    throw new Error('Authentication required.');
  } else {
    // Handle other errors
    throw new Error('Failed to create TM adjustment. Please try again.');
  }
}
```

### Component Error Handling

```typescript
function TmAdjustmentPanel({ routineId }: Props) {
  const { data: summary, error, isLoading } = useGetTmAdjustmentSummary(routineId);
  const createMutation = useCreateTmAdjustment();

  if (error) {
    return (
      <div className="error-container">
        <p>Failed to load TM adjustments: {error.message}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (createMutation.error) {
    return (
      <div className="error-container">
        <p>Failed to create adjustment: {createMutation.error.message}</p>
      </div>
    );
  }

  // ... rest of component
}
```

## Performance Optimization

### Caching Strategy

```typescript
// Different stale times based on data volatility
const CACHE_TIMES = {
  adjustments: 5 * 60 * 1000,  // 5 minutes - adjustments change frequently
  summary: 10 * 60 * 1000,     // 10 minutes - summaries change less often
};

// Prefetch related data
const prefetchTmData = (routineId: string) => {
  queryClient.prefetchQuery({
    queryKey: tmAdjustmentKeys.summary(routineId),
    queryFn: () => TmAdjustmentService.getTmAdjustmentSummary(routineId),
    staleTime: CACHE_TIMES.summary,
  });
};
```

### Optimistic Updates

```typescript
const useOptimisticTmAdjustment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: TmAdjustmentService.createTmAdjustment,
    onMutate: async ({ routineId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: tmAdjustmentKeys.adjustments(routineId)
      });

      // Snapshot previous value
      const previousAdjustments = queryClient.getQueryData(
        tmAdjustmentKeys.adjustments(routineId)
      );

      // Optimistically update
      const optimisticAdjustment = {
        id: `temp-${Date.now()}`,
        routineId,
        ...data,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(
        tmAdjustmentKeys.adjustments(routineId),
        (old: TmEventResponse[] = []) => [optimisticAdjustment, ...old]
      );

      return { previousAdjustments };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousAdjustments) {
        queryClient.setQueryData(
          tmAdjustmentKeys.adjustments(variables.routineId),
          context.previousAdjustments
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after mutation
      queryClient.invalidateQueries({
        queryKey: tmAdjustmentKeys.routine(variables.routineId)
      });
    },
  });
};
```

## Testing

### Service Testing

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TmAdjustmentService } from './tm-adjustment.service';
import { httpClient } from './httpClient';

vi.mock('./httpClient');

describe('TmAdjustmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create TM adjustment', async () => {
    const mockAdjustment = {
      id: 'adjustment-123',
      routineId: 'routine-456',
      exerciseId: 'exercise-789',
      exerciseName: 'Bench Press',
      weekNumber: 3,
      deltaKg: 2.5,
      preTmKg: 100,
      postTmKg: 102.5,
      reason: 'Good progress',
      style: 'STANDARD',
      createdAt: '2025-09-23T12:00:00.000Z'
    };

    vi.mocked(httpClient.request).mockResolvedValue(mockAdjustment);

    const result = await TmAdjustmentService.createTmAdjustment('routine-456', {
      exerciseId: 'exercise-789',
      weekNumber: 3,
      deltaKg: 2.5,
      preTmKg: 100,
      postTmKg: 102.5,
      reason: 'Good progress'
    });

    expect(result).toEqual(mockAdjustment);
    expect(httpClient.request).toHaveBeenCalledWith(
      '/routines/routine-456/tm-events',
      {
        method: 'POST',
        body: JSON.stringify({
          exerciseId: 'exercise-789',
          weekNumber: 3,
          deltaKg: 2.5,
          preTmKg: 100,
          postTmKg: 102.5,
          reason: 'Good progress'
        }),
        secure: true,
      }
    );
  });

  it('should get TM adjustments with filters', async () => {
    const mockAdjustments = [
      { id: '1', exerciseId: 'ex-1', weekNumber: 1 },
      { id: '2', exerciseId: 'ex-1', weekNumber: 2 }
    ];

    vi.mocked(httpClient.request).mockResolvedValue(mockAdjustments);

    const result = await TmAdjustmentService.getTmAdjustments('routine-123', {
      exerciseId: 'ex-1',
      minWeek: 1,
      maxWeek: 5
    });

    expect(result).toEqual(mockAdjustments);
    expect(httpClient.request).toHaveBeenCalledWith(
      '/routines/routine-123/tm-events?exerciseId=ex-1&minWeek=1&maxWeek=5',
      {
        method: 'GET',
        secure: true,
      }
    );
  });

  it('should get TM adjustment summary', async () => {
    const mockSummary = [
      {
        exerciseId: 'ex-1',
        exerciseName: 'Bench Press',
        totalDeltaKg: 7.5,
        averageDeltaKg: 2.5,
        adjustmentCount: 3,
        lastAdjustmentDate: '2025-09-23T12:00:00.000Z'
      }
    ];

    vi.mocked(httpClient.request).mockResolvedValue(mockSummary);

    const result = await TmAdjustmentService.getTmAdjustmentSummary('routine-123');

    expect(result).toEqual(mockSummary);
    expect(httpClient.request).toHaveBeenCalledWith(
      '/routines/routine-123/tm-events/summary',
      {
        method: 'GET',
        secure: true,
      }
    );
  });
});
```

### Hook Testing

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateTmAdjustment } from './use-tm-adjustments';
import { TmAdjustmentService } from '../services/tm-adjustment.service';

vi.mock('../services/tm-adjustment.service');

describe('useCreateTmAdjustment', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should create TM adjustment successfully', async () => {
    const mockAdjustment = {
      id: 'adjustment-123',
      routineId: 'routine-456',
      exerciseId: 'exercise-789',
      weekNumber: 3,
      deltaKg: 2.5,
      preTmKg: 100,
      postTmKg: 102.5
    };

    vi.mocked(TmAdjustmentService.createTmAdjustment).mockResolvedValue(mockAdjustment);

    const { result } = renderHook(() => useCreateTmAdjustment(), { wrapper });

    result.current.mutate({
      routineId: 'routine-456',
      data: {
        exerciseId: 'exercise-789',
        weekNumber: 3,
        deltaKg: 2.5,
        preTmKg: 100,
        postTmKg: 102.5
      }
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockAdjustment);
  });
});
```

## Integration Examples

### TM Adjustment Panel Component

```typescript
function TmAdjustmentPanel({ routineId, rtfExercises }: Props) {
  const { data: summary } = useGetTmAdjustmentSummary(routineId);
  const createMutation = useCreateTmAdjustment();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateAdjustment = async (data: CreateTmEventRequest) => {
    try {
      await createMutation.mutateAsync({ routineId, data });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create adjustment:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Training Max Adjustments</span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Adjustment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <TmAdjustmentForm
                rtfExercises={rtfExercises}
                onSubmit={handleCreateAdjustment}
                isLoading={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {summary?.map(item => (
          <TmSummaryCard key={item.exerciseId} summary={item} />
        ))}
      </CardContent>
    </Card>
  );
}
```

### TM Progress Visualization

```typescript
function TmProgressChart({ routineId, exerciseId }: Props) {
  const { data: adjustments } = useGetTmAdjustments(routineId, { exerciseId });

  const chartData = useMemo(() => {
    if (!adjustments) return [];
    
    return adjustments
      .sort((a, b) => a.weekNumber - b.weekNumber)
      .map(adj => ({
        week: adj.weekNumber,
        tm: adj.postTmKg,
        delta: adj.deltaKg,
        reason: adj.reason
      }));
  }, [adjustments]);

  return (
    <div className="tm-chart">
      <h4>Training Max Progression</h4>
      {/* Chart implementation */}
      <LineChart data={chartData} />
    </div>
  );
}
```

## Analytics Integration

### TM Trend Analysis

```typescript
// Client-side analytics helper
export interface TmAdjustmentEvent {
  exerciseId?: string;
  week: number;
  previousTm: number;
  newTm: number;
  percentChange: number;
  style: 'STANDARD' | 'HYPERTROPHY';
  timestamp: number;
}

export function analyzeTmTrends(adjustments: TmEventResponse[]): TmAdjustmentEvent[] {
  return adjustments.map(adj => ({
    exerciseId: adj.exerciseId,
    week: adj.weekNumber,
    previousTm: adj.preTmKg,
    newTm: adj.postTmKg,
    percentChange: ((adj.postTmKg - adj.preTmKg) / adj.preTmKg) * 100,
    style: adj.style || 'STANDARD',
    timestamp: new Date(adj.createdAt).getTime()
  }));
}
```

## Future Enhancements

### Potential API Extensions

```typescript
// Future endpoint possibilities
interface TmAdjustmentServiceExtensions {
  // Bulk create adjustments
  createBulkAdjustments(
    routineId: string, 
    adjustments: CreateTmEventRequest[]
  ): Promise<TmEventResponse[]>;
  
  // Update existing adjustment
  updateTmAdjustment(
    routineId: string, 
    adjustmentId: string, 
    data: Partial<CreateTmEventRequest>
  ): Promise<TmEventResponse>;
  
  // Delete adjustment
  deleteTmAdjustment(routineId: string, adjustmentId: string): Promise<void>;
  
  // Get TM progression chart data
  getTmProgression(
    routineId: string, 
    exerciseId: string
  ): Promise<TmProgressionData>;
  
  // Export TM data
  exportTmData(routineId: string, format: 'csv' | 'json'): Promise<Blob>;
}
```

## Related Documentation

- [Routine Service](./routines.md) - For PROGRAMMED_RTF routine management
- [Workout Service](./workouts.md) - For workout session integration
- [API Types](../types/tm-adjustment-types.md) - Type definitions
- [React Query Hooks](../../hooks/api-hooks/use-tm-adjustments.md) - Hook usage patterns
- [Authentication](../authentication.md) - Authentication requirements
- [RTF Analytics](../../analytics/tm-trend-analysis.md) - Analytics integration

---

*For implementation details and advanced usage patterns, refer to the source code in `lib/api/services/tm-adjustment.service.ts`.*