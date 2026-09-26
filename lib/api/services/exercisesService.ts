import type {
	CustomExerciseInput,
	StarredExercisesResponse,
	UpdateCustomExerciseRequest,
} from '@sunsteel/contracts'

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

	// EXER-06: the caller's own exercises.
	createCustom: (input: CustomExerciseInput): Promise<Exercise> =>
		httpClient.request<Exercise>('/exercises/custom', {
			method: 'POST',
			secure: true,
			body: JSON.stringify(input),
		}),

	updateCustom: (
		id: string,
		patch: UpdateCustomExerciseRequest,
	): Promise<Exercise> =>
		httpClient.request<Exercise>(`/exercises/custom/${id}`, {
			method: 'PATCH',
			secure: true,
			body: JSON.stringify(patch),
		}),

	setCustomArchived: (id: string, archived: boolean): Promise<Exercise> =>
		httpClient.request<Exercise>(
			`/exercises/custom/${id}/${archived ? 'archive' : 'restore'}`,
			{ method: 'POST', secure: true },
		),

	deleteCustom: (id: string): Promise<void> =>
		httpClient.request<void>(`/exercises/custom/${id}`, {
			method: 'DELETE',
			secure: true,
		}),
}
