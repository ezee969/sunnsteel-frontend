import { Exercise } from '../types/exercise.type'
import { httpClient } from './httpClient'

export const exercisesService = {
	/**
	 * Get all exercises
	 */
	async getAll(): Promise<Exercise[]> {
		return httpClient.request<Exercise[]>('/exercises', {
			method: 'GET',
			secure: true,
		})
	},
}
