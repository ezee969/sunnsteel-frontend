import { httpClient } from './httpClient';
import { Exercise } from '../types/exercise.type';

export const exercisesService = {
  /**
   * Get all exercises
   */
  async getAll(): Promise<Exercise[]> {
    return httpClient.request<Exercise[]>('/exercises', {
      method: 'GET',
      secure: true,
    });
  },
};
