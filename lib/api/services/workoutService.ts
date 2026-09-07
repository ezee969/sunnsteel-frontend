import {
	FinishWorkoutRequest,
	ListSessionsParams,
	PaginatedResponse,
	PreviousPerformanceResponse,
	SetLog,
	StartWorkoutRequest,
	UpsertSetLogRequest,
	WorkoutSession,
	WorkoutSessionSummary,
} from '../types/workout.type'
import {
	WorkoutProgress,
	WorkoutProgressQuery,
} from '../types/workout-progress.type'
import { WorkoutStats, WorkoutStatsQuery } from '../types/workout-stats.type'
import { httpClient, requestWithMeta } from './httpClient'

const WORKOUTS_API_URL = '/workouts'

/**
 * Hard ceiling the backend enforces on `limit` for the sessions list
 * (`@Max(50)` on `ListSessionsDto`, see `../sunnsteel-backend`).
 *
 * Asking for more does not degrade gracefully — the DTO validation rejects the
 * **whole request** with a 400. The dashboard asked for 100 and its four stat
 * cards silently rendered 0 for everyone until it was caught. See TD-22.
 */
export const MAX_SESSIONS_LIMIT = 50

/**
 * Pure query-string builder for the sessions list. Extracted so the limit cap
 * is enforced in one place and can be tested without touching the network.
 */
export function buildSessionsQueryString(params: ListSessionsParams): string {
	const usp = new URLSearchParams()
	if (params.status) usp.set('status', params.status)
	if (params.routineId) usp.set('routineId', params.routineId)
	if (params.from) usp.set('from', params.from)
	if (params.to) usp.set('to', params.to)
	if (params.q) usp.set('q', params.q)
	if (params.cursor) usp.set('cursor', params.cursor)
	if (params.limit != null) {
		usp.set('limit', String(Math.min(params.limit, MAX_SESSIONS_LIMIT)))
	}
	if (params.sort) usp.set('sort', params.sort)
	const qs = usp.toString()
	return qs ? `?${qs}` : ''
}

export const workoutService = {
	getStats: (params: WorkoutStatsQuery): Promise<WorkoutStats> =>
		httpClient.get<WorkoutStats>(
			`${WORKOUTS_API_URL}/stats?${new URLSearchParams({ ...params })}`,
			true,
		),
	getProgress: (params: WorkoutProgressQuery): Promise<WorkoutProgress> =>
		httpClient.get<WorkoutProgress>(
			`${WORKOUTS_API_URL}/progress?${new URLSearchParams({ ...params })}`,
			true,
		),
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
			const serverMsg = (res.data as { message?: string })?.message
			const msg = serverMsg || `Request failed with status: ${res.status}`
			// Throw with status prefix so callers can branch on 4xx without parsing
			throw new Error(`STATUS:${res.status}:${msg}`)
		}
		return res.data as WorkoutSession
	},

	getActiveSession: async (): Promise<WorkoutSession | null> => {
		const res = await httpClient.request<WorkoutSession | null>(
			`${WORKOUTS_API_URL}/sessions/active`,
			{
				method: 'GET',
				secure: true,
			},
		)
		// Normalize empty or invalid responses to null
		if (res && typeof res === 'object' && (res as WorkoutSession).id) {
			return res as WorkoutSession
		}
		return null
	},

	getSessionById: async (id: string): Promise<WorkoutSession> => {
		return httpClient.request<WorkoutSession>(
			`${WORKOUTS_API_URL}/sessions/${id}`,
			{
				method: 'GET',
				secure: true,
			},
		)
	},

	getPreviousPerformance: async (
		id: string,
	): Promise<PreviousPerformanceResponse | null> => {
		return httpClient.request<PreviousPerformanceResponse | null>(
			`${WORKOUTS_API_URL}/sessions/${id}/previous-performance`,
			{
				method: 'GET',
				secure: true,
			},
		)
	},

	finishSession: async (
		id: string,
		data: FinishWorkoutRequest,
	): Promise<WorkoutSession> => {
		return httpClient.request<WorkoutSession>(
			`${WORKOUTS_API_URL}/sessions/${id}/finish`,
			{
				method: 'PATCH',
				body: JSON.stringify(data),
				secure: true,
			},
		)
	},

	upsertSetLog: async (
		id: string,
		data: UpsertSetLogRequest,
	): Promise<SetLog> => {
		return httpClient.request<SetLog>(
			`${WORKOUTS_API_URL}/sessions/${id}/set-logs`,
			{
				method: 'PUT',
				body: JSON.stringify(data),
				secure: true,
			},
		)
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
		)
	},

	listSessions: async (
		params: ListSessionsParams,
	): Promise<PaginatedResponse<WorkoutSessionSummary>> => {
		const qs = buildSessionsQueryString(params)
		return httpClient.request<PaginatedResponse<WorkoutSessionSummary>>(
			`${WORKOUTS_API_URL}/sessions${qs}`,
			{ method: 'GET', secure: true },
		)
	},
}
