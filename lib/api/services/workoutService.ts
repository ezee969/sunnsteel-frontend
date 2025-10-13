import { httpClient, requestWithMeta } from './httpClient';
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

const WORKOUTS_API_URL = '/workouts';

export const workoutService = {
  startSession: async (data: StartWorkoutRequest): Promise<WorkoutSession> => {
    const res = await requestWithMeta<WorkoutSession>(
      `${WORKOUTS_API_URL}/sessions/start`,
      {
        method: 'POST',
        body: JSON.stringify(data),
        secure: true,
      },
    )
    if (!res.ok) {
      const serverMsg = (res.data as any)?.message as string | undefined
      const msg = serverMsg || `Request failed with status: ${res.status}`
      // Throw with status prefix so callers can branch on 4xx without parsing
      throw new Error(`STATUS:${res.status}:${msg}`)
    }
    return (res.data as WorkoutSession)
  },

  getActiveSession: async (): Promise<WorkoutSession | null> => {
    const res = await httpClient.request<WorkoutSession | null>(
      `${WORKOUTS_API_URL}/sessions/active`,
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
    return httpClient.request<WorkoutSession>(`${WORKOUTS_API_URL}/sessions/${id}`, {
      method: 'GET',
      secure: true,
    });
  },

  finishSession: async (id: string, data: FinishWorkoutRequest): Promise<WorkoutSession> => {
    return httpClient.request<WorkoutSession>(`${WORKOUTS_API_URL}/sessions/${id}/finish`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      secure: true,
    });
  },

  upsertSetLog: async (id: string, data: UpsertSetLogRequest): Promise<SetLog> => {
    return httpClient.request<SetLog>(`${WORKOUTS_API_URL}/sessions/${id}/set-logs`, {
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
      `${WORKOUTS_API_URL}/sessions/${id}/set-logs/${routineExerciseId}/${setNumber}`,
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
      `${WORKOUTS_API_URL}/sessions${qs ? `?${qs}` : ''}`,
      { method: 'GET', secure: true },
    );
  },
};
