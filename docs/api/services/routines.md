# Routine Service API

## Overview

The Routine Service manages workout routines, including creation, modification, and lifecycle management. It provides endpoints for CRUD operations, favorite/completion toggles, and filtering capabilities.

## Base Configuration

```typescript
const ROUTINES_API_URL = '/routines';
```

All endpoints require authentication via Supabase session token.

## Endpoints

### Get User Routines

Retrieve all routines for the authenticated user with optional filtering.

#### Request

```http
GET /routines
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `isFavorite` | boolean | No | Filter by favorite status |
| `isCompleted` | boolean | No | Filter by completion status |
| `include` | string[] | No | Include related data (e.g., 'rtfGoals') |
| `week` | number | No | Week number for RTF goals |

#### Example Requests

```typescript
// Get all routines
const routines = await routineService.getUserRoutines();

// Get only favorite routines
const favorites = await routineService.getUserRoutines({ 
  isFavorite: true 
});

// Get routines with RTF goals for week 1
const withGoals = await routineService.getUserRoutines({ 
  include: ['rtfGoals'], 
  week: 1 
});
```

#### Response

```typescript
interface Routine {
  id: string;
  name: string;
  description?: string;
  isFavorite: boolean;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  // Additional fields based on include parameter
  rtfGoals?: RtfGoal[];
}

type Response = Routine[];
```

#### Status Codes

- `200`: Success
- `401`: Unauthorized
- `500`: Internal Server Error

---

### Get Routine by ID

Retrieve a specific routine by its ID with optional related data.

#### Request

```http
GET /routines/:id
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Routine ID |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `include` | string[] | No | Include related data (e.g., 'rtfGoals') |
| `week` | number | No | Week number for RTF goals |

#### Example Requests

```typescript
// Get routine by ID
const routine = await routineService.getById('routine-123');

// Get routine with RTF goals
const routineWithGoals = await routineService.getById('routine-123', {
  include: ['rtfGoals'],
  week: 2
});
```

#### Response

```typescript
type Response = Routine;
```

#### Status Codes

- `200`: Success
- `404`: Routine not found
- `401`: Unauthorized
- `500`: Internal Server Error

---

### Create Routine

Create a new workout routine.

#### Request

```http
POST /routines
```

#### Request Body

```typescript
interface CreateRoutineRequest {
  name: string;
  description?: string;
  days: RoutineDay[];
  // Additional fields for routine configuration
}

interface RoutineDay {
  name: string;
  exercises: RoutineExercise[];
}

interface RoutineExercise {
  exerciseId: string;
  sets: ExerciseSet[];
  restTimeSeconds?: number;
  progressionScheme?: ProgressionScheme;
  // Additional exercise configuration
}
```

#### Example Request

```typescript
const newRoutine = await routineService.create({
  name: "Push/Pull/Legs",
  description: "3-day split routine",
  days: [
    {
      name: "Push Day",
      exercises: [
        {
          exerciseId: "bench-press-123",
          sets: [
            { reps: 8, weight: 100 },
            { reps: 8, weight: 100 },
            { reps: 8, weight: 100 }
          ],
          restTimeSeconds: 180
        }
      ]
    }
  ]
});
```

#### Response

```typescript
type Response = Routine;
```

#### Status Codes

- `201`: Created successfully
- `400`: Invalid request data
- `401`: Unauthorized
- `500`: Internal Server Error

---

### Update Routine

Update an existing routine.

#### Request

```http
PATCH /routines/:id
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Routine ID |

#### Request Body

Same as Create Routine request body.

#### Example Request

```typescript
const updatedRoutine = await routineService.update('routine-123', {
  name: "Updated Push/Pull/Legs",
  description: "Modified 3-day split routine",
  // ... rest of routine data
});
```

#### Response

```typescript
type Response = Routine;
```

#### Status Codes

- `200`: Updated successfully
- `400`: Invalid request data
- `404`: Routine not found
- `401`: Unauthorized
- `500`: Internal Server Error

---

### Delete Routine

Delete a routine permanently.

#### Request

```http
DELETE /routines/:id
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Routine ID |

#### Example Request

```typescript
await routineService.delete('routine-123');
```

#### Response

```typescript
type Response = void;
```

#### Status Codes

- `204`: Deleted successfully
- `404`: Routine not found
- `401`: Unauthorized
- `500`: Internal Server Error

---

### Toggle Favorite

Toggle the favorite status of a routine.

#### Request

```http
PATCH /routines/:id/favorite
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Routine ID |

#### Request Body

```typescript
interface ToggleFavoriteRequest {
  isFavorite: boolean;
}
```

#### Example Request

```typescript
const updatedRoutine = await routineService.toggleFavorite('routine-123', true);
```

#### Response

```typescript
type Response = Routine;
```

#### Status Codes

- `200`: Updated successfully
- `404`: Routine not found
- `401`: Unauthorized
- `500`: Internal Server Error

---

### Toggle Completed

Toggle the completion status of a routine.

#### Request

```http
PATCH /routines/:id/completed
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Routine ID |

#### Request Body

```typescript
interface ToggleCompletedRequest {
  isCompleted: boolean;
}
```

#### Example Request

```typescript
const updatedRoutine = await routineService.toggleCompleted('routine-123', true);
```

#### Response

```typescript
type Response = Routine;
```

#### Status Codes

- `200`: Updated successfully
- `404`: Routine not found
- `401`: Unauthorized
- `500`: Internal Server Error

---

### Get Completed Routines

Retrieve all completed routines for the authenticated user.

#### Request

```http
GET /routines/completed
```

#### Example Request

```typescript
const completedRoutines = await routineService.getCompleted();
```

#### Response

```typescript
type Response = Routine[];
```

#### Status Codes

- `200`: Success
- `401`: Unauthorized
- `500`: Internal Server Error

## Service Implementation

### TypeScript Service

```typescript
import { httpClient } from './httpClient';
import { CreateRoutineRequest, Routine } from '../types/routine.type';

export const routineService = {
  getUserRoutines: async (filters?: {
    isFavorite?: boolean;
    isCompleted?: boolean;
    include?: string[];
    week?: number;
  }): Promise<Routine[]> => {
    const qs = new URLSearchParams();
    if (typeof filters?.isFavorite === 'boolean') {
      qs.set('isFavorite', String(filters.isFavorite));
    }
    if (typeof filters?.isCompleted === 'boolean') {
      qs.set('isCompleted', String(filters.isCompleted));
    }
    if (filters?.include?.length) {
      qs.set('include', filters.include.join(','));
    }
    if (typeof filters?.week === 'number') {
      qs.set('week', String(filters.week));
    }

    const url = `/routines${qs.toString() ? `?${qs.toString()}` : ''}`;
    return httpClient.request<Routine[]>(url, {
      method: 'GET',
      secure: true,
    });
  },

  getById: async (id: string, options?: {
    include?: string[];
    week?: number;
  }): Promise<Routine> => {
    const qs = new URLSearchParams();
    if (options?.include?.length) {
      qs.set('include', options.include.join(','));
    }
    if (typeof options?.week === 'number') {
      qs.set('week', String(options.week));
    }

    const url = `/routines/${id}${qs.toString() ? `?${qs.toString()}` : ''}`;
    return httpClient.request<Routine>(url, {
      method: 'GET',
      secure: true,
    });
  },

  create: async (data: CreateRoutineRequest): Promise<Routine> => {
    return httpClient.request<Routine>('/routines', {
      method: 'POST',
      body: JSON.stringify(data),
      secure: true,
    });
  },

  update: async (id: string, data: CreateRoutineRequest): Promise<Routine> => {
    return httpClient.request<Routine>(`/routines/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      secure: true,
    });
  },

  delete: async (id: string): Promise<void> => {
    return httpClient.request<void>(`/routines/${id}`, {
      method: 'DELETE',
      secure: true,
    });
  },

  toggleFavorite: async (id: string, isFavorite: boolean): Promise<Routine> => {
    return httpClient.request<Routine>(`/routines/${id}/favorite`, {
      method: 'PATCH',
      body: JSON.stringify({ isFavorite }),
      secure: true,
    });
  },

  toggleCompleted: async (id: string, isCompleted: boolean): Promise<Routine> => {
    return httpClient.request<Routine>(`/routines/${id}/completed`, {
      method: 'PATCH',
      body: JSON.stringify({ isCompleted }),
      secure: true,
    });
  },

  getCompleted: async (): Promise<Routine[]> => {
    return httpClient.request<Routine[]>('/routines/completed', {
      method: 'GET',
      secure: true,
    });
  },
};
```

## Error Handling

### Common Error Responses

```typescript
interface ApiError {
  error: string;
  code: number;
  details?: string;
}
```

### Error Scenarios

- **401 Unauthorized**: Session expired or invalid token
- **404 Not Found**: Routine doesn't exist or user doesn't have access
- **400 Bad Request**: Invalid request data or validation errors
- **500 Internal Server Error**: Server-side processing error

### Error Handling Example

```typescript
try {
  const routine = await routineService.getById('invalid-id');
} catch (error) {
  if (error.message.includes('404')) {
    console.error('Routine not found');
  } else if (error.message.includes('401')) {
    console.error('Authentication required');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Testing

### Service Testing Example

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { routineService } from './routineService';
import { httpClient } from './httpClient';

vi.mock('./httpClient');

describe('routineService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user routines', async () => {
    const mockRoutines = [
      { id: '1', name: 'Test Routine', isFavorite: false }
    ];
    
    vi.mocked(httpClient.request).mockResolvedValue(mockRoutines);

    const result = await routineService.getUserRoutines();

    expect(result).toEqual(mockRoutines);
    expect(httpClient.request).toHaveBeenCalledWith('/routines', {
      method: 'GET',
      secure: true,
    });
  });

  it('should create a new routine', async () => {
    const routineData = {
      name: 'New Routine',
      description: 'Test routine',
      days: []
    };
    const mockResponse = { id: '123', ...routineData };

    vi.mocked(httpClient.request).mockResolvedValue(mockResponse);

    const result = await routineService.create(routineData);

    expect(result).toEqual(mockResponse);
    expect(httpClient.request).toHaveBeenCalledWith('/routines', {
      method: 'POST',
      body: JSON.stringify(routineData),
      secure: true,
    });
  });
});
```

## Related Documentation

- [Workout Service](./workouts.md) - For workout session management
- [Exercise Service](./exercises.md) - For exercise database operations
- [API Types](../types/routine-types.md) - Type definitions
- [React Query Hooks](../../hooks/api-hooks/use-routines.md) - Hook usage patterns
- [Authentication](../authentication.md) - Authentication requirements

---

*For implementation details and advanced usage patterns, refer to the source code in `lib/api/services/routineService.ts`.*