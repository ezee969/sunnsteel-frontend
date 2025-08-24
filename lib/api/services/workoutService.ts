import { httpClient } from './httpClient';
import {
  FinishWorkoutRequest,
  SetLog,
  StartWorkoutRequest,
  WorkoutSession,
  UpsertSetLogRequest,
} from '../types/workout.type';

const WORKOUTS_API_URL = '/workouts';

export const workoutService = {
  startSession: async (data: StartWorkoutRequest): Promise<WorkoutSession> => {
    return httpClient.request<WorkoutSession>(`${WORKOUTS_API_URL}/sessions/start`, {
      method: 'POST',
      body: JSON.stringify(data),
      secure: true,
    });
  },

  getActiveSession: async (): Promise<WorkoutSession | null> => {
    return httpClient.request<WorkoutSession | null>(`${WORKOUTS_API_URL}/sessions/active`, {
      method: 'GET',
      secure: true,
    });
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
};
