# Workout Service API

## Overview

The Workout Service manages workout sessions, including starting sessions, tracking progress, logging sets, and managing session history. It provides endpoints for the complete workout lifecycle from initiation to completion.

## Base Configuration

```typescript
const WORKOUTS_API_URL = '/workouts';
```

All endpoints require authentication via Supabase session token.

## Endpoints

### Start Workout Session

Start a new workout session from a routine.

#### Request

```http
POST /workouts/sessions/start
```

#### Request Body

```typescript
interface StartWorkoutRequest {
  routineId: string;
  routineDayId: string;
  notes?: string;
}
```

#### Example Request

```typescript
const session = await workoutService.startSession({
  routineId: 'routine-123',
  routineDayId: 'day-456',
  notes: 'Feeling strong today!'
});
```

#### Response

```typescript
interface WorkoutSession {
  id: string;
  routineId: string;
  routineDayId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startedAt: string;
  finishedAt?: string;
  notes?: string;
  setLogs: SetLog[];
  routine: {
    id: string;
    name: string;
  };
  routineDay: {
    id: string;
    name: string;
    exercises: RoutineExercise[];
  };
}

type Response = WorkoutSession;
```

#### Status Codes

- `201`: Session started successfully
- `400`: Invalid request data or active session exists
- `401`: Unauthorized
- `404`: Routine or routine day not found
- `500`: Internal Server Error

---

### Get Active Session

Retrieve the currently active workout session for the user.

#### Request

```http
GET /workouts/sessions/active
```

#### Example Request

```typescript
const activeSession = await workoutService.getActiveSession();
// Returns null if no active session
```

#### Response

```typescript
type Response = WorkoutSession | null;
```

#### Status Codes

- `200`: Success (may return null if no active session)
- `401`: Unauthorized
- `500`: Internal Server Error

---

### Get Session by ID

Retrieve a specific workout session by its ID.

#### Request

```http
GET /workouts/sessions/:id
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Session ID |

#### Example Request

```typescript
const session = await workoutService.getSessionById('session-123');
```

#### Response

```typescript
type Response = WorkoutSession;
```

#### Status Codes

- `200`: Success
- `404`: Session not found
- `401`: Unauthorized
- `500`: Internal Server Error

---

### Finish Session

Complete or cancel a workout session.

#### Request

```http
PATCH /workouts/sessions/:id/finish
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Session ID |

#### Request Body

```typescript
interface FinishWorkoutRequest {
  status: 'COMPLETED' | 'CANCELLED';
  notes?: string;
}
```

#### Example Request

```typescript
const finishedSession = await workoutService.finishSession('session-123', {
  status: 'COMPLETED',
  notes: 'Great workout! Hit all targets.'
});
```

#### Response

```typescript
type Response = WorkoutSession;
```

#### Status Codes

- `200`: Session finished successfully
- `400`: Invalid status or session already finished
- `404`: Session not found
- `401`: Unauthorized
- `500`: Internal Server Error

---

### Upsert Set Log

Create or update a set log entry for a workout session.

#### Request

```http
PUT /workouts/sessions/:id/set-logs
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Session ID |

#### Request Body

```typescript
interface UpsertSetLogRequest {
  routineExerciseId: string;
  exerciseId: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  rpe?: number;
  isCompleted?: boolean;
}
```

#### Example Request

```typescript
const setLog = await workoutService.upsertSetLog('session-123', {
  routineExerciseId: 'routine-exercise-456',
  exerciseId: 'exercise-789',
  setNumber: 1,
  reps: 8,
  weight: 100,
  rpe: 7,
  isCompleted: true
});
```

#### Response

```typescript
interface SetLog {
  id: string;
  sessionId: string;
  routineExerciseId: string;
  exerciseId: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  rpe?: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

type Response = SetLog;
```

#### Status Codes

- `200`: Set log updated successfully
- `201`: Set log created successfully
- `400`: Invalid request data
- `404`: Session not found
- `401`: Unauthorized
- `500`: Internal Server Error

---

### Delete Set Log

Remove a set log entry from a workout session.

#### Request

```http
DELETE /workouts/sessions/:id/set-logs/:routineExerciseId/:setNumber
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Session ID |
| `routineExerciseId` | string | Yes | Routine exercise ID |
| `setNumber` | number | Yes | Set number to delete |

#### Example Request

```typescript
await workoutService.deleteSetLog('session-123', 'routine-exercise-456', 2);
```

#### Response

```typescript
interface DeleteResponse {
  id: string;
}

type Response = DeleteResponse;
```

#### Status Codes

- `200`: Set log deleted successfully
- `404`: Session or set log not found
- `401`: Unauthorized
- `500`: Internal Server Error

---

### List Sessions

Retrieve workout sessions with filtering and pagination.

#### Request

```http
GET /workouts/sessions
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by session status |
| `routineId` | string | No | Filter by routine ID |
| `from` | string | No | Start date filter (ISO string) |
| `to` | string | No | End date filter (ISO string) |
| `q` | string | No | Search query |
| `cursor` | string | No | Pagination cursor |
| `limit` | number | No | Results per page (default: 20) |
| `sort` | string | No | Sort order |

#### Example Requests

```typescript
// Get all sessions
const sessions = await workoutService.listSessions({});

// Get completed sessions for a specific routine
const completedSessions = await workoutService.listSessions({
  status: 'COMPLETED',
  routineId: 'routine-123',
  limit: 10
});

// Get sessions from last week
const recentSessions = await workoutService.listSessions({
  from: '2024-01-01T00:00:00Z',
  to: '2024-01-07T23:59:59Z',
  sort: 'startedAt:desc'
});
```

#### Response

```typescript
interface WorkoutSessionSummary {
  id: string;
  routineId: string;
  routineName: string;
  routineDayName: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startedAt: string;
  finishedAt?: string;
  duration?: number; // in seconds
  totalSets: number;
  completedSets: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    total?: number;
  };
}

type Response = PaginatedResponse<WorkoutSessionSummary>;
```

#### Status Codes

- `200`: Success
- `400`: Invalid query parameters
- `401`: Unauthorized
- `500`: Internal Server Error

## Service Implementation

### TypeScript Service

```typescript
import { httpClient } from './httpClient';
import {
  FinishWorkoutRequest,
  SetLog,
  StartWorkoutRequest,
  WorkoutSession,
  UpsertSetLogRequest,
  ListSessionsParams,
  PaginatedResponse,
  WorkoutSessionSummary,
} from '../types/workout.type';

export const workoutService = {
  startSession: async (data: StartWorkoutRequest): Promise<WorkoutSession> => {
    return httpClient.request<WorkoutSession>('/workouts/sessions/start', {
      method: 'POST',
      body: JSON.stringify(data),
      secure: true,
    });
  },

  getActiveSession: async (): Promise<WorkoutSession | null> => {
    const res = await httpClient.request<WorkoutSession | null>(
      '/workouts/sessions/active',
      {
        method: 'GET',
        secure: true,
      },
    );
    // Normalize empty or invalid responses to null
    if (res && typeof res === 'object' && (res as WorkoutSession).id) {
      return res as WorkoutSession;
    }
    return null;
  },

  getSessionById: async (id: string): Promise<WorkoutSession> => {
    return httpClient.request<WorkoutSession>(`/workouts/sessions/${id}`, {
      method: 'GET',
      secure: true,
    });
  },

  finishSession: async (id: string, data: FinishWorkoutRequest): Promise<WorkoutSession> => {
    return httpClient.request<WorkoutSession>(`/workouts/sessions/${id}/finish`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      secure: true,
    });
  },

  upsertSetLog: async (id: string, data: UpsertSetLogRequest): Promise<SetLog> => {
    return httpClient.request<SetLog>(`/workouts/sessions/${id}/set-logs`, {
      method: 'PUT',
      body: JSON.stringify(data),
      secure: true,
    });
  },

  deleteSetLog: async (
    id: string,
    routineExerciseId: string,
    setNumber: number,
  ): Promise<{ id: string }> => {
    return httpClient.request<{ id: string }>(
      `/workouts/sessions/${id}/set-logs/${routineExerciseId}/${setNumber}`,
      {
        method: 'DELETE',
        secure: true,
      },
    );
  },

  listSessions: async (
    params: ListSessionsParams,
  ): Promise<PaginatedResponse<WorkoutSessionSummary>> => {
    const usp = new URLSearchParams();
    if (params.status) usp.set('status', params.status);
    if (params.routineId) usp.set('routineId', params.routineId);
    if (params.from) usp.set('from', params.from);
    if (params.to) usp.set('to', params.to);
    if (params.q) usp.set('q', params.q);
    if (params.cursor) usp.set('cursor', params.cursor);
    if (params.limit != null) usp.set('limit', String(params.limit));
    if (params.sort) usp.set('sort', params.sort);
    
    const qs = usp.toString();
    return httpClient.request<PaginatedResponse<WorkoutSessionSummary>>(
      `/workouts/sessions${qs ? `?${qs}` : ''}`,
      { method: 'GET', secure: true },
    );
  },
};
```

## Workflow Examples

### Complete Workout Flow

```typescript
// 1. Start a workout session
const session = await workoutService.startSession({
  routineId: 'routine-123',
  routineDayId: 'day-456'
});

// 2. Log sets during the workout
for (let setNumber = 1; setNumber <= 3; setNumber++) {
  await workoutService.upsertSetLog(session.id, {
    routineExerciseId: 'exercise-789',
    exerciseId: 'bench-press',
    setNumber,
    reps: 8,
    weight: 100,
    rpe: 7,
    isCompleted: true
  });
}

// 3. Finish the session
const completedSession = await workoutService.finishSession(session.id, {
  status: 'COMPLETED',
  notes: 'Great workout!'
});
```

### Active Session Management & Navigation

The workout service provides comprehensive active session management with built-in conflict resolution and navigation patterns.

#### Basic Session Check

```typescript
// Check for active session on app start
const activeSession = await workoutService.getActiveSession();
if (activeSession) {
  // Resume existing session
  console.log('Resuming workout:', activeSession.id);
} else {
  // No active session, user can start new one
  console.log('No active workout session');
}
```

#### Active Session Conflict Resolution

When attempting to start a new workout while an active session exists, the API returns the existing session with a `reused: true` flag for idempotent behavior:

```typescript
// Attempt to start new session
try {
  const response = await workoutService.startSession({
    routineId: 'routine-456',
    routineDayId: 'day-789'
  });
  
  if (response.reused) {
    // Existing session was returned instead of creating new one
    console.log('Active session detected:', response.id);
    
    // Handle navigation to active session
    handleActiveSessionConflict(response);
  } else {
    // New session created successfully
    console.log('New session started:', response.id);
  }
} catch (error) {
  console.error('Failed to start session:', error);
}
```

#### Navigation Patterns for Active Sessions

```typescript
import { useRouter } from 'next/navigation';
import { useWorkoutSessionManager } from '@/features/routines/hooks/useWorkoutSessionManager';

// Component-level active session management
const WorkoutStartButton = ({ routineId, routine }) => {
  const router = useRouter();
  const sessionManager = useWorkoutSessionManager(routineId, routine);
  
  const handleStartWorkout = async () => {
    try {
      const response = await sessionManager.startWorkout();
      
      if (response.reused) {
        // Show conflict dialog with navigation option
        sessionManager.showActiveConflictDialog();
      } else {
        // Navigate to new session
        router.push(`/workouts/sessions/${response.id}`);
      }
    } catch (error) {
      console.error('Failed to start workout:', error);
    }
  };
  
  const handleGoToActiveSession = () => {
    router.push('/workouts/sessions/active');
    sessionManager.closeActiveConflictDialog();
  };
  
  return (
    <>
      <button onClick={handleStartWorkout}>
        Start Workout
      </button>
      
      {/* Active session conflict dialog */}
      <WorkoutDialogs
        activeConflictOpen={sessionManager.showActiveConflictDialog}
        onActiveConflictClose={sessionManager.closeActiveConflictDialog}
        onGoToActiveSession={handleGoToActiveSession}
        // ... other dialog props
      />
    </>
  );
};
```

#### Session State Synchronization

```typescript
// Real-time session state management
const useActiveSessionSync = () => {
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const router = useRouter();
  
  // Check for active session on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const session = await workoutService.getActiveSession();
        setActiveSession(session);
      } catch (error) {
        console.error('Failed to check active session:', error);
      }
    };
    
    checkActiveSession();
  }, []);
  
  // Navigate to active session
  const goToActiveSession = useCallback(() => {
    if (activeSession) {
      router.push(`/workouts/sessions/${activeSession.id}`);
    } else {
      router.push('/workouts/sessions/active');
    }
  }, [activeSession, router]);
  
  // Clear active session state on completion
  const clearActiveSession = useCallback(() => {
    setActiveSession(null);
  }, []);
  
  return {
    activeSession,
    goToActiveSession,
    clearActiveSession,
    hasActiveSession: !!activeSession
  };
};
```

#### Multi-Route Active Session Handling

```typescript
// Handle active session conflicts across different routes
const useGlobalActiveSessionHandler = () => {
  const router = useRouter();
  
  const handleActiveSessionConflict = useCallback(async (
    targetRoutineId: string,
    activeSession: WorkoutSession
  ) => {
    // Check if active session belongs to target routine
    if (activeSession.routineId === targetRoutineId) {
      // Same routine - navigate to active session
      router.push(`/workouts/sessions/${activeSession.id}`);
      return;
    }
    
    // Different routine - show conflict dialog
    const userChoice = await showActiveSessionDialog({
      activeRoutineName: activeSession.routine.name,
      targetRoutineName: await getRoutineName(targetRoutineId)
    });
    
    if (userChoice === 'go-to-active') {
      router.push(`/workouts/sessions/${activeSession.id}`);
    } else if (userChoice === 'finish-current') {
      // Navigate to active session to finish it first
      router.push(`/workouts/sessions/${activeSession.id}?action=finish`);
    }
    // If cancelled, stay on current page
  }, [router]);
  
  return { handleActiveSessionConflict };
};
```

### Session History & Analytics

```typescript
// Get session history with filtering
const history = await workoutService.listSessions({
  status: 'COMPLETED',
  limit: 10,
  sort: 'startedAt:desc'
});

// Get sessions for specific routine
const routineSessions = await workoutService.listSessions({
  routineId: 'routine-123',
  from: '2024-01-01T00:00:00Z',
  to: '2024-01-31T23:59:59Z'
});
```

## Error Handling

### Common Error Scenarios

```typescript
try {
  const session = await workoutService.startSession(data);
} catch (error) {
  if (error.message.includes('active session exists')) {
    // User already has an active session
    const activeSession = await workoutService.getActiveSession();
    console.log('Active session found:', activeSession?.id);
  } else if (error.message.includes('404')) {
    // Routine or routine day not found
    console.error('Routine not found');
  } else {
    console.error('Failed to start session:', error.message);
  }
}
```

### Set Log Error Handling

```typescript
try {
  await workoutService.upsertSetLog(sessionId, setData);
} catch (error) {
  if (error.message.includes('session not found')) {
    // Session may have been finished or cancelled
    console.error('Session no longer active');
  } else if (error.message.includes('validation')) {
    // Invalid set data
    console.error('Invalid set data:', error.message);
  }
}
```

## Testing

### Service Testing Example

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workoutService } from './workoutService';
import { httpClient } from './httpClient';

vi.mock('./httpClient');

describe('workoutService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start a workout session', async () => {
    const startData = {
      routineId: 'routine-123',
      routineDayId: 'day-456'
    };
    const mockSession = {
      id: 'session-789',
      ...startData,
      status: 'ACTIVE',
      startedAt: '2024-01-01T10:00:00Z'
    };

    vi.mocked(httpClient.request).mockResolvedValue(mockSession);

    const result = await workoutService.startSession(startData);

    expect(result).toEqual(mockSession);
    expect(httpClient.request).toHaveBeenCalledWith('/workouts/sessions/start', {
      method: 'POST',
      body: JSON.stringify(startData),
      secure: true,
    });
  });

  it('should handle null active session', async () => {
    vi.mocked(httpClient.request).mockResolvedValue(null);

    const result = await workoutService.getActiveSession();

    expect(result).toBeNull();
  });

  it('should upsert set log', async () => {
    const setData = {
      routineExerciseId: 'exercise-123',
      exerciseId: 'bench-press',
      setNumber: 1,
      reps: 8,
      weight: 100
    };
    const mockSetLog = { id: 'set-456', ...setData };

    vi.mocked(httpClient.request).mockResolvedValue(mockSetLog);

    const result = await workoutService.upsertSetLog('session-123', setData);

    expect(result).toEqual(mockSetLog);
  });
});
```

## Performance Considerations

### Optimistic Updates

```typescript
// Optimistically update UI before API call
const optimisticSetLog = {
  id: 'temp-id',
  ...setData,
  isCompleted: true
};

// Update UI immediately
updateLocalState(optimisticSetLog);

try {
  // Make API call
  const actualSetLog = await workoutService.upsertSetLog(sessionId, setData);
  // Replace optimistic update with real data
  updateLocalState(actualSetLog);
} catch (error) {
  // Revert optimistic update on error
  revertLocalState(optimisticSetLog.id);
}
```

### Batch Operations

```typescript
// For multiple set logs, consider batching
const setLogs = [
  { setNumber: 1, reps: 8, weight: 100 },
  { setNumber: 2, reps: 8, weight: 100 },
  { setNumber: 3, reps: 6, weight: 100 }
];

// Process in parallel but with rate limiting
const results = await Promise.allSettled(
  setLogs.map(setData => 
    workoutService.upsertSetLog(sessionId, {
      routineExerciseId,
      exerciseId,
      ...setData
    })
  )
);
```

## Related Documentation

- [Routine Service](./routines.md) - For routine management
- [Exercise Service](./exercises.md) - For exercise database operations
- [API Types](../types/workout-types.md) - Type definitions
- [React Query Hooks](../../hooks/api-hooks/use-workouts.md) - Hook usage patterns
- [Authentication](../authentication.md) - Authentication requirements

---

*For implementation details and advanced usage patterns, refer to the source code in `lib/api/services/workoutService.ts`.*