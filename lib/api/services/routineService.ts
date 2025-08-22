import { httpClient } from './httpClient';
import { CreateRoutineRequest, Routine } from '../types/routine.type';

const ROUTINES_API_URL = '/routines';

export const routineService = {
  getUserRoutines: async (): Promise<Routine[]> => {
    return httpClient.request<Routine[]>(ROUTINES_API_URL, {
      method: 'GET',
      secure: true,
    });
  },

  getById: async (id: string): Promise<Routine> => {
    return httpClient.request<Routine>(`${ROUTINES_API_URL}/${id}`, {
      method: 'GET',
      secure: true,
    });
  },

  create: async (data: CreateRoutineRequest): Promise<Routine> => {
    return httpClient.request<Routine>(ROUTINES_API_URL, {
      method: 'POST',
      body: JSON.stringify(data),
      secure: true,
    });
  },

  update: async (id: string, data: CreateRoutineRequest): Promise<Routine> => {
    return httpClient.request<Routine>(`${ROUTINES_API_URL}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      secure: true,
    });
  },

  delete: async (id: string): Promise<void> => {
    return httpClient.request<void>(`${ROUTINES_API_URL}/${id}`, {
      method: 'DELETE',
      secure: true,
    });
  },
};
