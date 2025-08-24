import { httpClient } from './httpClient';
import { CreateRoutineRequest, Routine } from '../types/routine.type';

const ROUTINES_API_URL = '/routines';

export const routineService = {
  getUserRoutines: async (filters?: {
    isFavorite?: boolean;
    isCompleted?: boolean;
  }): Promise<Routine[]> => {
    const qs = new URLSearchParams();
    if (typeof filters?.isFavorite === 'boolean') {
      qs.set('isFavorite', String(filters.isFavorite));
    }
    if (typeof filters?.isCompleted === 'boolean') {
      qs.set('isCompleted', String(filters.isCompleted));
    }

    const url = `${ROUTINES_API_URL}${qs.toString() ? `?${qs.toString()}` : ''}`;
    return httpClient.request<Routine[]>(url, {
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

  toggleFavorite: async (
    id: string,
    isFavorite: boolean,
  ): Promise<Routine> => {
    return httpClient.request<Routine>(`${ROUTINES_API_URL}/${id}/favorite`, {
      method: 'PATCH',
      body: JSON.stringify({ isFavorite }),
      secure: true,
    });
  },

  toggleCompleted: async (
    id: string,
    isCompleted: boolean,
  ): Promise<Routine> => {
    return httpClient.request<Routine>(`${ROUTINES_API_URL}/${id}/completed`, {
      method: 'PATCH',
      body: JSON.stringify({ isCompleted }),
      secure: true,
    });
  },

  getCompleted: async (): Promise<Routine[]> => {
    return httpClient.request<Routine[]>(`${ROUTINES_API_URL}/completed`, {
      method: 'GET',
      secure: true,
    });
  },
};
