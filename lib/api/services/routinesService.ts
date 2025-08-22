import { httpClient } from './httpClient';
import { Routine, CreateRoutineRequest } from '../types/routine.type';

export const routinesService = {
  /**
   * Get all routines for the current user
   */
  async getAll(): Promise<Routine[]> {
    return httpClient.request<Routine[]>('/routines', {
      method: 'GET',
      secure: true,
    });
  },

  /**
   * Get a specific routine by ID
   */
  async getById(id: string): Promise<Routine> {
    return httpClient.request<Routine>(`/routines/${id}`, {
      method: 'GET',
      secure: true,
    });
  },

  /**
   * Create a new routine
   */
  async create(data: CreateRoutineRequest): Promise<Routine> {
    return httpClient.request<Routine>('/routines', {
      method: 'POST',
      secure: true,
      body: JSON.stringify(data),
    });
  },
};
