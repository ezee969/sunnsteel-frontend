import type {
	CorrectSessionRequest,
	CorrectSessionResponse,
	CreateSessionShareRequest,
	DeloadSuggestionResponse,
	PersonalGoalsResponse,
	PlateausResponse,
	SessionCorrectionsResponse,
	SessionShare,
	SessionShareListResponse,
	SharedSessionRecap,
	SubstituteSessionExerciseRequest,
	SubstituteSessionExerciseResponse,
	TrainingSignalsResponse,
	UpdateSessionNotesRequest,
	UpdateSessionNotesResponse,
} from '@sunsteel/contracts'

import {
	FinishWorkoutRequest,
	FinishWorkoutResponse,
	ListSessionsParams,
	PaginatedResponse,
	PreviousPerformanceResponse,
	StartWorkoutRequest,
	UpsertSetLogRequest,
	UpsertSetLogResponse,
	WorkoutSession,
	WorkoutSessionRecap,
	WorkoutSessionSummary,
} from '../types/workout.type'
import {
	ExercisePerformanceHistoryQuery,
	ExercisePerformanceHistoryResponse,
	ExerciseStrengthTrendQuery,
	ExerciseStrengthTrendResponse,
	MuscleGroupHeatmapQuery,
	MuscleGroupHeatmapResponse,
	ProgressTimelineQuery,
	ProgressTimelineResponse,
	SessionComparisonQuery,
	SessionComparisonResponse,
	VolumeTrendQuery,
	VolumeTrendResponse,
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

export function buildStrengthTrendQueryString(
	params: ExerciseStrengthTrendQuery,
): string {
	const search = new URLSearchParams()
	if (params.exerciseId) search.set('exerciseId', params.exerciseId)
	if (params.from) search.set('from', params.from)
	if (params.to) search.set('to', params.to)
	const query = search.toString()
	return query ? `?${query}` : ''
}

export function buildExercisePerformanceQueryString(
	params: ExercisePerformanceHistoryQuery,
): string {
	const search = new URLSearchParams()
	if (params.exerciseId) search.set('exerciseId', params.exerciseId)
	if (params.from) search.set('from', params.from)
	if (params.to) search.set('to', params.to)
	if (params.cursor) search.set('cursor', params.cursor)
	if (params.limit != null) {
		search.set('limit', String(Math.min(params.limit, 30)))
	}
	const query = search.toString()
	return query ? `?${query}` : ''
}

export function buildMuscleGroupHeatmapQueryString(
	params: MuscleGroupHeatmapQuery,
): string {
	const search = new URLSearchParams({ timeZone: params.timeZone })
	if (params.weeks != null) search.set('weeks', String(params.weeks))
	return `?${search}`
}

export function buildVolumeTrendQueryString(params: VolumeTrendQuery): string {
	const search = new URLSearchParams({ timeZone: params.timeZone })
	if (params.weeks != null) search.set('weeks', String(params.weeks))
	return `?${search}`
}

export function buildPersonalGoalsQueryString(timeZone: string): string {
	return `?${new URLSearchParams({ timeZone })}`
}

export function buildSessionComparisonQueryString(
	params: SessionComparisonQuery,
): string {
	const search = new URLSearchParams()
	if (params.routineDayId) search.set('routineDayId', params.routineDayId)
	const query = search.toString()
	return query ? `?${query}` : ''
}

export function buildProgressTimelineQueryString(
	params: ProgressTimelineQuery,
): string {
	const search = new URLSearchParams()
	if (params.type) search.set('type', params.type)
	if (params.exerciseId) search.set('exerciseId', params.exerciseId)
	if (params.cursor) search.set('cursor', params.cursor)
	if (params.limit != null) {
		search.set('limit', String(Math.min(params.limit, 50)))
	}
	const query = search.toString()
	return query ? `?${query}` : ''
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
	getStrengthTrend: (
		params: ExerciseStrengthTrendQuery,
	): Promise<ExerciseStrengthTrendResponse> =>
		httpClient.get<ExerciseStrengthTrendResponse>(
			`${WORKOUTS_API_URL}/progress/strength${buildStrengthTrendQueryString(params)}`,
			true,
		),
	getExercisePerformance: (
		params: ExercisePerformanceHistoryQuery,
	): Promise<ExercisePerformanceHistoryResponse> =>
		httpClient.get<ExercisePerformanceHistoryResponse>(
			`${WORKOUTS_API_URL}/progress/performance${buildExercisePerformanceQueryString(params)}`,
			true,
		),
	getMuscleGroupHeatmap: (
		params: MuscleGroupHeatmapQuery,
	): Promise<MuscleGroupHeatmapResponse> =>
		httpClient.get<MuscleGroupHeatmapResponse>(
			`${WORKOUTS_API_URL}/progress/muscles${buildMuscleGroupHeatmapQueryString(params)}`,
			true,
		),
	getVolumeTrend: (params: VolumeTrendQuery): Promise<VolumeTrendResponse> =>
		httpClient.get<VolumeTrendResponse>(
			`${WORKOUTS_API_URL}/progress/volume${buildVolumeTrendQueryString(params)}`,
			true,
		),
	getPersonalGoals: (timeZone: string): Promise<PersonalGoalsResponse> =>
		httpClient.get<PersonalGoalsResponse>(
			`${WORKOUTS_API_URL}/progress/goals${buildPersonalGoalsQueryString(timeZone)}`,
			true,
		),
	getSessionComparison: (
		params: SessionComparisonQuery,
	): Promise<SessionComparisonResponse> =>
		httpClient.get<SessionComparisonResponse>(
			`${WORKOUTS_API_URL}/progress/session-comparison${buildSessionComparisonQueryString(params)}`,
			true,
		),
	/** PROG-09: lifts that have gone several sessions without a new best. */
	getPlateaus: (): Promise<PlateausResponse> =>
		httpClient.get<PlateausResponse>(
			`${WORKOUTS_API_URL}/progress/plateaus`,
			true,
		),
	/** INTEL-02: a deload suggested from sustained signals, or why none is. */
	getDeloadSuggestion: (): Promise<DeloadSuggestionResponse> =>
		httpClient.get<DeloadSuggestionResponse>(
			`${WORKOUTS_API_URL}/progress/deload-suggestion`,
			true,
		),
	/** PROG-10: the four training signals, stated with their evidence. */
	getTrainingSignals: (): Promise<TrainingSignalsResponse> =>
		httpClient.get<TrainingSignalsResponse>(
			`${WORKOUTS_API_URL}/progress/signals`,
			true,
		),
	getProgressTimeline: (
		params: ProgressTimelineQuery,
	): Promise<ProgressTimelineResponse> =>
		httpClient.get<ProgressTimelineResponse>(
			`${WORKOUTS_API_URL}/progress/timeline${buildProgressTimelineQueryString(params)}`,
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

	createSessionShare: async (
		sessionId: string,
		data: CreateSessionShareRequest,
	): Promise<SessionShare> =>
		httpClient.request<SessionShare>(
			`${WORKOUTS_API_URL}/sessions/${sessionId}/shares`,
			{ method: 'POST', body: JSON.stringify(data), secure: true },
		),

	listSessionShares: async (
		sessionId: string,
	): Promise<SessionShareListResponse> =>
		httpClient.get<SessionShareListResponse>(
			`${WORKOUTS_API_URL}/sessions/${sessionId}/shares`,
			true,
		),

	revokeSessionShare: async (
		sessionId: string,
		shareId: string,
	): Promise<void> =>
		httpClient.delete<void>(
			`${WORKOUTS_API_URL}/sessions/${sessionId}/shares/${shareId}`,
			true,
		),

	// Unauthenticated on purpose: the token is the credential (SOC-07).
	getSharedSession: async (token: string): Promise<SharedSessionRecap> =>
		httpClient.get<SharedSessionRecap>(
			`/shared/sessions/${encodeURIComponent(token)}`,
		),

	getSessionRecap: async (id: string): Promise<WorkoutSessionRecap> => {
		return httpClient.request<WorkoutSessionRecap>(
			`${WORKOUTS_API_URL}/sessions/${id}/recap`,
			{
				method: 'GET',
				secure: true,
			},
		)
	},

	// LIVE-16: the owner's notes about one workout, during it or after it.
	updateSessionNotes: async (
		id: string,
		data: UpdateSessionNotesRequest,
	): Promise<UpdateSessionNotesResponse> =>
		httpClient.request<UpdateSessionNotesResponse>(
			`${WORKOUTS_API_URL}/sessions/${id}/notes`,
			{ method: 'PUT', body: JSON.stringify(data), secure: true },
		),

	// LIVE-17: whether the workout can still be corrected, and its trail.
	getSessionCorrections: async (
		id: string,
	): Promise<SessionCorrectionsResponse> =>
		httpClient.get<SessionCorrectionsResponse>(
			`${WORKOUTS_API_URL}/sessions/${id}/corrections`,
			true,
		),

	correctSession: async (
		id: string,
		data: CorrectSessionRequest,
	): Promise<CorrectSessionResponse> =>
		httpClient.request<CorrectSessionResponse>(
			`${WORKOUTS_API_URL}/sessions/${id}/corrections`,
			{ method: 'POST', body: JSON.stringify(data), secure: true },
		),

	finishSession: async (
		id: string,
		data: FinishWorkoutRequest,
	): Promise<FinishWorkoutResponse> => {
		return httpClient.request<FinishWorkoutResponse>(
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
	): Promise<UpsertSetLogResponse> => {
		return httpClient.request<UpsertSetLogResponse>(
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

	/** LIVE-11: perform a different exercise for one slot of the session. */
	substituteExercise: async (
		id: string,
		routineExerciseId: string,
		data: SubstituteSessionExerciseRequest,
	): Promise<SubstituteSessionExerciseResponse> => {
		return httpClient.request<SubstituteSessionExerciseResponse>(
			`${WORKOUTS_API_URL}/sessions/${id}/exercises/${routineExerciseId}/substitution`,
			{
				method: 'PUT',
				body: JSON.stringify(data),
				secure: true,
			},
		)
	},

	revertExerciseSubstitution: async (
		id: string,
		routineExerciseId: string,
	): Promise<SubstituteSessionExerciseResponse> => {
		return httpClient.request<SubstituteSessionExerciseResponse>(
			`${WORKOUTS_API_URL}/sessions/${id}/exercises/${routineExerciseId}/substitution`,
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
