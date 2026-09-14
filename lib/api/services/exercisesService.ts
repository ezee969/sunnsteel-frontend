import type { StarredExercisesResponse } from '@sunsteel/contracts'

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

	/** The owner's starred exercises, newest first (EXER-07). */
	getStarred: (): Promise<StarredExercisesResponse> =>
		httpClient.get<StarredExercisesResponse>('/exercises/starred', true),

	star: (exerciseId: string): Promise<StarredExercisesResponse> =>
		httpClient.request<StarredExercisesResponse>(
			`/exercises/${exerciseId}/star`,
			{ method: 'PUT', secure: true },
		),

	unstar: (exerciseId: string): Promise<StarredExercisesResponse> =>
		httpClient.request<StarredExercisesResponse>(
			`/exercises/${exerciseId}/star`,
			{ method: 'DELETE', secure: true },
		),
}
