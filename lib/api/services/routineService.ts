import type {
	CreateDeloadRequest,
	CreateRoutineVersionRequest,
	RestoreRoutineVersionResponse,
	RoutineTemporaryOverride,
	RoutineTemporaryOverridesResponse,
	RoutineTrainingBlock,
	RoutineTrainingBlockRevisionsResponse,
	RoutineTrainingBlocksResponse,
	RoutineVersion,
	RoutineVersionsResponse,
	UpsertRoutineTrainingBlockRequest,
} from '@sunsteel/contracts'

import {
	buildRoutineQueryString,
	RoutineDetailOptions,
	RoutineFilters,
} from '../routines/routine-query'
import {
	CreateRoutineRequest,
	Routine,
	UpdateRoutineRequest,
} from '../types/routine.type'
import { httpClient } from './httpClient'

const ROUTINES_API_URL = '/routines'

export const routineService = {
	getUserRoutines: async (filters?: RoutineFilters): Promise<Routine[]> => {
		const url = `${ROUTINES_API_URL}${buildRoutineQueryString(filters)}`
		return httpClient.request<Routine[]>(url, {
			method: 'GET',
			secure: true,
		})
	},

	getById: async (
		id: string,
		options?: RoutineDetailOptions,
	): Promise<Routine> => {
		const url = `${ROUTINES_API_URL}/${id}${buildRoutineQueryString(options)}`
		return httpClient.request<Routine>(url, {
			method: 'GET',
			secure: true,
		})
	},

	create: async (data: CreateRoutineRequest): Promise<Routine> => {
		return httpClient.request<Routine>(ROUTINES_API_URL, {
			method: 'POST',
			body: JSON.stringify(data),
			secure: true,
		})
	},

	update: async (id: string, data: UpdateRoutineRequest): Promise<Routine> => {
		return httpClient.request<Routine>(`${ROUTINES_API_URL}/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data),
			secure: true,
		})
	},

	delete: async (id: string): Promise<void> => {
		return httpClient.request<void>(`${ROUTINES_API_URL}/${id}`, {
			method: 'DELETE',
			secure: true,
		})
	},

	toggleFavorite: async (id: string, isFavorite: boolean): Promise<Routine> => {
		return httpClient.request<Routine>(`${ROUTINES_API_URL}/${id}/favorite`, {
			method: 'PATCH',
			body: JSON.stringify({ isFavorite }),
			secure: true,
		})
	},

	toggleCompleted: async (
		id: string,
		isCompleted: boolean,
	): Promise<Routine> => {
		return httpClient.request<Routine>(`${ROUTINES_API_URL}/${id}/completed`, {
			method: 'PATCH',
			body: JSON.stringify({ isCompleted }),
			secure: true,
		})
	},

	getCompleted: async (): Promise<Routine[]> => {
		return httpClient.request<Routine[]>(`${ROUTINES_API_URL}/completed`, {
			method: 'GET',
			secure: true,
		})
	},

	getVersions: async (id: string): Promise<RoutineVersionsResponse> =>
		httpClient.request<RoutineVersionsResponse>(
			`${ROUTINES_API_URL}/${id}/versions`,
			{ method: 'GET', secure: true },
		),

	createVersion: async (
		id: string,
		data: CreateRoutineVersionRequest,
	): Promise<RoutineVersion> =>
		httpClient.request<RoutineVersion>(`${ROUTINES_API_URL}/${id}/versions`, {
			method: 'POST',
			body: JSON.stringify(data),
			secure: true,
		}),

	restoreVersion: async (
		id: string,
		versionId: string,
	): Promise<RestoreRoutineVersionResponse> =>
		httpClient.request<RestoreRoutineVersionResponse>(
			`${ROUTINES_API_URL}/${id}/versions/${versionId}/restore`,
			{ method: 'POST', secure: true },
		),

	deleteVersion: async (id: string, versionId: string): Promise<void> =>
		httpClient.request<void>(
			`${ROUTINES_API_URL}/${id}/versions/${versionId}`,
			{ method: 'DELETE', secure: true },
		),

	getTrainingBlocks: async (
		id: string,
	): Promise<RoutineTrainingBlocksResponse> =>
		httpClient.request<RoutineTrainingBlocksResponse>(
			`${ROUTINES_API_URL}/${id}/training-blocks`,
			{ method: 'GET', secure: true },
		),

	createTrainingBlock: async (
		id: string,
		data: UpsertRoutineTrainingBlockRequest,
	): Promise<RoutineTrainingBlock> =>
		httpClient.request<RoutineTrainingBlock>(
			`${ROUTINES_API_URL}/${id}/training-blocks`,
			{
				method: 'POST',
				body: JSON.stringify(data),
				secure: true,
			},
		),

	updateTrainingBlock: async (
		id: string,
		blockId: string,
		data: UpsertRoutineTrainingBlockRequest,
	): Promise<RoutineTrainingBlock> =>
		httpClient.request<RoutineTrainingBlock>(
			`${ROUTINES_API_URL}/${id}/training-blocks/${blockId}`,
			{
				method: 'PUT',
				body: JSON.stringify(data),
				secure: true,
			},
		),

	getTrainingBlockRevisions: async (
		id: string,
		blockId: string,
	): Promise<RoutineTrainingBlockRevisionsResponse> =>
		httpClient.request<RoutineTrainingBlockRevisionsResponse>(
			`${ROUTINES_API_URL}/${id}/training-blocks/${blockId}/revisions`,
			{ method: 'GET', secure: true },
		),

	deleteTrainingBlock: async (id: string, blockId: string): Promise<void> =>
		httpClient.request<void>(
			`${ROUTINES_API_URL}/${id}/training-blocks/${blockId}`,
			{ method: 'DELETE', secure: true },
		),

	getDeloads: async (id: string): Promise<RoutineTemporaryOverridesResponse> =>
		httpClient.request<RoutineTemporaryOverridesResponse>(
			`${ROUTINES_API_URL}/${id}/deloads`,
			{ method: 'GET', secure: true },
		),

	createDeload: async (
		id: string,
		data: CreateDeloadRequest,
	): Promise<RoutineTemporaryOverride> =>
		httpClient.request<RoutineTemporaryOverride>(
			`${ROUTINES_API_URL}/${id}/deloads`,
			{ method: 'POST', body: JSON.stringify(data), secure: true },
		),

	endDeloadEarly: async (
		id: string,
		deloadId: string,
	): Promise<RoutineTemporaryOverride> =>
		httpClient.request<RoutineTemporaryOverride>(
			`${ROUTINES_API_URL}/${id}/deloads/${deloadId}/end`,
			{ method: 'POST', secure: true },
		),

	cancelDeload: async (id: string, deloadId: string): Promise<void> =>
		httpClient.request<void>(`${ROUTINES_API_URL}/${id}/deloads/${deloadId}`, {
			method: 'DELETE',
			secure: true,
		}),
}
