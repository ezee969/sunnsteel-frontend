import type {
	CorrectSessionRequest,
	CorrectSessionResponse,
	DeloadSuggestionResponse,
	PlateauPreferences,
	PlateausResponse,
	SessionCorrectionsResponse,
	SubstituteSessionExerciseRequest,
	SubstituteSessionExerciseResponse,
	TrainingSignalsResponse,
	UpdateSessionNotesRequest,
	UpdateSessionNotesResponse,
} from '@sunsteel/contracts'
import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { useToast } from '@/components/ui/toast'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { buildPersonalRecordCelebration } from '@/lib/utils/personal-record-celebration'
import { setSaveState } from '@/lib/utils/save-status-store'
// Temporary auth abstraction: migrate from legacy auth-provider to Supabase auth.
import { useSupabaseAuth as useAuth } from '@/providers/supabase-auth-provider'

import { routineQueryKeys } from '../routines/routine-query'
import { userService } from '../services/userService'
import { workoutService } from '../services/workoutService'
import {
	FinishWorkoutRequest,
	FinishWorkoutResponse,
	ListSessionsParams,
	PreviousPerformanceResponse,
	SetLog,
	StartWorkoutRequest,
	UpsertSetLogRequest,
	UpsertSetLogResponse,
	WorkoutSession,
	WorkoutSessionRecap,
	WorkoutSessionSummary,
} from '../types/workout.type'
import type {
	ExercisePerformanceHistoryQuery,
	ExercisePerformanceHistoryResponse,
	ExerciseStrengthTrendQuery,
	MuscleGroupHeatmapQuery,
	MuscleGroupHeatmapResponse,
	PersonalGoalsResponse,
	ProgressTimelineEventType,
	ProgressTimelineResponse,
	SessionComparisonResponse,
	VolumeTrendQuery,
	VolumeTrendResponse,
} from '../types/workout-progress.type'
import { getWorkoutStatsQuery } from '../types/workout-stats.type'
import { type StartedSession, startSessionOnce } from './start-session'
import { useWorkoutAnalytics } from './useWorkoutAnalytics'

// Serialize params object to ensure stable query keys
function serializeSessionParams(
	params: Omit<ListSessionsParams, 'cursor' | 'limit'>,
) {
	if (!params || typeof params !== 'object') return 'no-params'
	const entries = Object.entries(params)
		.filter(([, v]) => v !== undefined && v !== null)
		.sort(([a], [b]) => a.localeCompare(b))

	if (!entries.length) return 'no-params'

	return entries
		.map(([k, v]) => {
			// Handle different value types
			if (typeof v === 'object') {
				return `${k}:${JSON.stringify(v)}`
			}
			return `${k}:${v}`
		})
		.join('|')
}

/**
 * INTEL-02: under the Progress prefix so a finished workout refreshes it, and
 * exported so a deload write can refresh it too.
 */
export const DELOAD_SUGGESTION_QUERY_KEY = [
	'workout',
	'progress',
	'deload-suggestion',
] as const

const qk = {
	stats: ['workout', 'stats'] as const,
	progress: ['workout', 'progress'] as const,
	strengthTrend: (params: ExerciseStrengthTrendQuery) =>
		[
			'workout',
			'progress',
			'strength',
			params.exerciseId ?? null,
			params.from ?? null,
			params.to ?? null,
		] as const,
	exercisePerformance: (
		params: Omit<ExercisePerformanceHistoryQuery, 'cursor' | 'limit'>,
	) =>
		[
			'workout',
			'progress',
			'performance',
			params.exerciseId ?? null,
			params.from ?? null,
			params.to ?? null,
		] as const,
	trainedExercises: ['workout', 'progress', 'trained-exercises'] as const,
	plateaus: ['workout', 'progress', 'plateaus'] as const,
	trainingSignals: ['workout', 'progress', 'signals'] as const,
	deloadSuggestion: DELOAD_SUGGESTION_QUERY_KEY,
	muscleHeatmap: (params: MuscleGroupHeatmapQuery) =>
		[
			'workout',
			'progress',
			'muscles',
			params.timeZone,
			params.weeks ?? null,
		] as const,
	volumeTrend: (params: VolumeTrendQuery) =>
		[
			'workout',
			'progress',
			'volume',
			params.timeZone,
			params.weeks ?? null,
		] as const,
	personalGoals: (timeZone: string) =>
		['workout', 'progress', 'goals', timeZone] as const,
	sessionComparison: (routineDayId?: string) =>
		[
			'workout',
			'progress',
			'session-comparison',
			routineDayId ?? null,
		] as const,
	progressTimeline: (type?: ProgressTimelineEventType, exerciseId?: string) =>
		[
			'workout',
			'progress',
			'timeline',
			type ?? null,
			exerciseId ?? null,
		] as const,
	active: ['workout', 'session', 'active'] as const,
	session: (id: string) => ['workout', 'session', id] as const,
	previousPerformance: (id: string) =>
		['workout', 'session', id, 'previous-performance'] as const,
	recap: (id: string) => ['workout', 'session', id, 'recap'] as const,
	corrections: (id: string) =>
		['workout', 'session', id, 'corrections'] as const,
	sessions: (params: Omit<ListSessionsParams, 'cursor' | 'limit'>) =>
		['workout', 'sessions', serializeSessionParams(params)] as const,
}

export const useWorkoutStats = () => {
	const { session, isLoading } = useAuth()
	const [, setClock] = useState(0)
	useEffect(() => {
		const timer = setInterval(() => setClock(value => value + 1), 60_000)
		return () => clearInterval(timer)
	}, [])
	const params = getWorkoutStatsQuery()
	return useQuery({
		queryKey: [...qk.stats, params],
		queryFn: () => workoutService.getStats(params),
		enabled: !isLoading && !!session,
	})
}

/** Progress is enabled only once an account generation is active. */
export const useWorkoutProgress = () => {
	const { session, isLoading } = useAuth()
	const analytics = useWorkoutAnalytics()
	const timeZone = analytics.data?.timeZone
	const query = useQuery({
		queryKey: [...qk.progress, timeZone],
		queryFn: () => workoutService.getProgress({ timeZone: timeZone! }),
		enabled: !isLoading && !!session && !!timeZone,
	})
	return {
		...query,
		bootstrapError:
			analytics.error ??
			(analytics.data?.state === 'FAILED'
				? new Error('Analytics setup failed')
				: null),
		retryBootstrap: analytics.retry,
	}
}

export const useExerciseStrengthTrend = (
	params: ExerciseStrengthTrendQuery,
	enabled = true,
) => {
	const { session, isLoading } = useAuth()
	return useQuery({
		queryKey: qk.strengthTrend(params),
		queryFn: () => workoutService.getStrengthTrend(params),
		enabled: enabled && !isLoading && !!session,
	})
}

export const useExercisePerformanceHistory = (
	params: Omit<ExercisePerformanceHistoryQuery, 'cursor' | 'limit'>,
	limit = 10,
	enabled = true,
) => {
	const { session, isLoading } = useAuth()
	return useInfiniteQuery<ExercisePerformanceHistoryResponse>({
		queryKey: qk.exercisePerformance(params),
		queryFn: ({ pageParam }) =>
			workoutService.getExercisePerformance({
				...params,
				cursor: (pageParam as string | undefined) ?? undefined,
				limit,
			}),
		initialPageParam: undefined,
		getNextPageParam: lastPage => lastPage.nextCursor,
		enabled: enabled && !isLoading && !!session,
	})
}

/**
 * Exercises with completed work in a finished session, each with its last
 * date (EXER-02). The performance read already returns that list regardless
 * of its date range; `limit: 1` keeps the page of sessions it also loads to a
 * single one.
 */
export const useTrainedExercises = () => {
	const { session, isLoading } = useAuth()
	return useQuery({
		queryKey: qk.trainedExercises,
		queryFn: () => workoutService.getExercisePerformance({ limit: 1 }),
		select: (data: ExercisePerformanceHistoryResponse) => data.exercises,
		enabled: !isLoading && !!session,
	})
}

/** PROG-09: the plateau watch; refreshed with the rest of Progress on finish. */
export const usePlateaus = () => {
	const { session, isLoading } = useAuth()
	return useQuery<PlateausResponse>({
		queryKey: qk.plateaus,
		queryFn: workoutService.getPlateaus,
		enabled: !isLoading && !!session,
	})
}

/** PROG-10: training signals; refreshed with the rest of Progress on finish. */
export const useTrainingSignals = () => {
	const { session, isLoading } = useAuth()
	return useQuery<TrainingSignalsResponse>({
		queryKey: qk.trainingSignals,
		queryFn: workoutService.getTrainingSignals,
		enabled: !isLoading && !!session,
	})
}

/** INTEL-02: the deload suggestion shown under the training signals. */
export const useDeloadSuggestion = () => {
	const { session, isLoading } = useAuth()
	return useQuery<DeloadSuggestionResponse>({
		queryKey: qk.deloadSuggestion,
		queryFn: workoutService.getDeloadSuggestion,
		enabled: !isLoading && !!session,
	})
}

/**
 * PREF-05: saves the account's plateau sensitivity. It stays pending until
 * the plateau watch has refetched, so the control never shows the old value
 * beside a list computed for the new one.
 */
export const useUpdatePlateauPreferences = () => {
	const qc = useQueryClient()
	return useMutation<PlateauPreferences, Error, PlateauPreferences>({
		mutationFn: userService.updatePlateauPreferences,
		onSuccess: () => qc.invalidateQueries({ queryKey: qk.plateaus }),
	})
}

export const useMuscleGroupHeatmap = (weeks = 8) => {
	const { session, isLoading } = useAuth()
	const analytics = useWorkoutAnalytics()
	const timeZone =
		analytics.data?.state === 'READY' ? analytics.data.timeZone : null
	const params = { timeZone: timeZone ?? '', weeks }
	const query = useQuery<MuscleGroupHeatmapResponse>({
		queryKey: qk.muscleHeatmap(params),
		queryFn: () => workoutService.getMuscleGroupHeatmap(params),
		enabled: !isLoading && !!session && !!timeZone,
	})
	const bootstrapError =
		analytics.error ??
		(analytics.data?.state === 'FAILED'
			? new Error('Analytics setup failed')
			: null)
	return {
		...query,
		isPending:
			!bootstrapError &&
			(analytics.isPending ||
				analytics.data?.state === 'BUILDING' ||
				query.isPending),
		error: bootstrapError ?? query.error,
		retry: bootstrapError ? analytics.retry : query.refetch,
	}
}

export const useVolumeTrend = (weeks = 8) => {
	const { session, isLoading } = useAuth()
	const analytics = useWorkoutAnalytics()
	const timeZone =
		analytics.data?.state === 'READY' ? analytics.data.timeZone : null
	const params = { timeZone: timeZone ?? '', weeks }
	const query = useQuery<VolumeTrendResponse>({
		queryKey: qk.volumeTrend(params),
		queryFn: () => workoutService.getVolumeTrend(params),
		enabled: !isLoading && !!session && !!timeZone,
	})
	const bootstrapError =
		analytics.error ??
		(analytics.data?.state === 'FAILED'
			? new Error('Analytics setup failed')
			: null)
	return {
		...query,
		isPending:
			!bootstrapError &&
			(analytics.isPending ||
				analytics.data?.state === 'BUILDING' ||
				query.isPending),
		error: bootstrapError ?? query.error,
		retry: bootstrapError ? analytics.retry : query.refetch,
	}
}

export const usePersonalGoals = () => {
	const { session, isLoading } = useAuth()
	const analytics = useWorkoutAnalytics()
	const timeZone =
		analytics.data?.state === 'READY' ? analytics.data.timeZone : null
	const query = useQuery<PersonalGoalsResponse>({
		queryKey: qk.personalGoals(timeZone ?? ''),
		queryFn: () => workoutService.getPersonalGoals(timeZone!),
		enabled: !isLoading && !!session && !!timeZone,
	})
	const bootstrapError =
		analytics.error ??
		(analytics.data?.state === 'FAILED'
			? new Error('Analytics setup failed')
			: null)
	return {
		...query,
		isPending:
			!bootstrapError &&
			(analytics.isPending ||
				analytics.data?.state === 'BUILDING' ||
				query.isPending),
		error: bootstrapError ?? query.error,
		retry: bootstrapError ? analytics.retry : query.refetch,
	}
}

export const useSessionComparison = (routineDayId?: string) => {
	const { session, isLoading } = useAuth()
	return useQuery<SessionComparisonResponse>({
		queryKey: qk.sessionComparison(routineDayId),
		queryFn: () => workoutService.getSessionComparison({ routineDayId }),
		enabled: !isLoading && !!session,
	})
}

/** `exerciseId` narrows the feed to one exercise (EXER-01). */
export const useProgressTimeline = (
	type?: ProgressTimelineEventType,
	{
		exerciseId,
		limit = 20,
		enabled = true,
	}: { exerciseId?: string; limit?: number; enabled?: boolean } = {},
) => {
	const { session, isLoading } = useAuth()
	return useInfiniteQuery<ProgressTimelineResponse>({
		queryKey: qk.progressTimeline(type, exerciseId),
		queryFn: ({ pageParam }) =>
			workoutService.getProgressTimeline({
				type,
				exerciseId,
				cursor: (pageParam as string | undefined) ?? undefined,
				limit,
			}),
		initialPageParam: undefined,
		getNextPageParam: lastPage => lastPage.nextCursor,
		enabled: enabled && !isLoading && !!session,
	})
}

export const useActiveSession = () => {
	const { session, isLoading } = useAuth()
	return useQuery({
		queryKey: qk.active,
		queryFn: () => workoutService.getActiveSession(),
		// Gated on the Supabase session, NOT on the backend verification: the
		// request already carries the bearer token, and the backend guard verifies
		// it (and get-or-creates the user) on its own. Waiting for `isAuthenticated`
		// put two serial round trips in front of the first data request. See TD-18.
		enabled: !isLoading && !!session,
	})
}

export const useSession = (id: string) => {
	return useQuery<WorkoutSession>({
		queryKey: qk.session(id),
		queryFn: () => workoutService.getSessionById(id),
		enabled: !!id,
		// Deliberate opt-out of the global 5-minute staleTime (TD-02): this is the
		// live training session, and showing set logs that are minutes out of date
		// would be a correctness bug, not a slow page. Always refetch on mount.
		staleTime: 0,
	})
}

export const usePreviousPerformance = (id: string) => {
	return useQuery<PreviousPerformanceResponse | null>({
		queryKey: qk.previousPerformance(id),
		queryFn: () => workoutService.getPreviousPerformance(id),
		enabled: !!id,
		// The comparison is against a completed session, so its result cannot
		// change while the current session is open.
		staleTime: Number.POSITIVE_INFINITY,
	})
}

export const useSessionRecap = (id: string, enabled = true) => {
	return useQuery<WorkoutSessionRecap>({
		queryKey: qk.recap(id),
		queryFn: () => workoutService.getSessionRecap(id),
		enabled: enabled && !!id,
		staleTime: Number.POSITIVE_INFINITY,
	})
}

/**
 * LIVE-16. The server answers with every note of the workout, so the session
 * cache is patched with what it stored rather than guessed; the recap and the
 * history list carry notes too and are refetched.
 */
export const useUpdateSessionNotes = (id: string) => {
	const qc = useQueryClient()
	return useMutation<
		UpdateSessionNotesResponse,
		Error,
		UpdateSessionNotesRequest
	>({
		mutationFn: data => workoutService.updateSessionNotes(id, data),
		onSuccess: saved => {
			qc.setQueryData<WorkoutSession>(qk.session(id), current =>
				current
					? {
							...current,
							notes: saved.notes,
							exerciseNotes: saved.exerciseNotes,
						}
					: current,
			)
			void qc.invalidateQueries({ queryKey: qk.recap(id) })
			void qc.invalidateQueries({ queryKey: ['workout', 'sessions'] })
		},
	})
}

/**
 * LIVE-17. Read fresh every time: the window closes with the clock and with
 * the next workout, and a stale "you can correct this" would be a promise the
 * server then refuses.
 */
export const useSessionCorrections = (id: string, enabled = true) => {
	return useQuery<SessionCorrectionsResponse>({
		queryKey: qk.corrections(id),
		queryFn: () => workoutService.getSessionCorrections(id),
		enabled: enabled && !!id,
		staleTime: 0,
	})
}

/**
 * A correction re-derives records, totals, achievements, the routine's loads
 * and activity on the server, so every read built from them is stale after
 * one — including the recap, which is otherwise cached forever.
 */
export const useCorrectSession = (id: string) => {
	const qc = useQueryClient()
	return useMutation<CorrectSessionResponse, Error, CorrectSessionRequest>({
		mutationFn: data => workoutService.correctSession(id, data),
		onSuccess: () => {
			for (const queryKey of [
				['workout'],
				['routines'],
				['achievements'],
				['activity'],
				['notifications'],
				['users'],
			])
				void qc.invalidateQueries({ queryKey })
		},
	})
}

export const useSessions = (
	params: Omit<ListSessionsParams, 'cursor' | 'limit'> & { limit?: number },
) => {
	const { session, isLoading } = useAuth()
	const { limit = 20, ...rest } = params
	return useInfiniteQuery<{
		items: WorkoutSessionSummary[]
		nextCursor?: string
	}>({
		queryKey: qk.sessions(rest),
		queryFn: ({ pageParam }) =>
			workoutService.listSessions({
				...rest,
				cursor: (pageParam as string | undefined) ?? undefined,
				limit,
			}),
		initialPageParam: undefined,
		getNextPageParam: lastPage => lastPage.nextCursor,
		// See useActiveSession above.
		enabled: !isLoading && !!session,
	})
}
// Exposed utility to mark a set as locally dirty (pending) before debounce/autosave
export function markSetPending(
	sessionId: string,
	routineExerciseId: string,
	setNumber: number,
) {
	setSaveState(`set:${sessionId}:${routineExerciseId}:${setNumber}`, 'pending')
}

export const useStartSession = () => {
	const qc = useQueryClient()
	const { push } = useToast()
	return useMutation({
		mutationFn: (data: StartWorkoutRequest): Promise<StartedSession> =>
			startSessionOnce(
				{
					getActiveSession: () => workoutService.getActiveSession(),
					startSession: payload => workoutService.startSession(payload),
				},
				data,
			),
		onSuccess: (data: StartedSession) => {
			qc.setQueryData(qk.active, data)
			qc.invalidateQueries({ queryKey: qk.stats })
			if (data.id) {
				if (data._reused) {
					// The active/start response is compact and omits set logs. Preserve the
					// detailed live-session cache and refresh it instead of replacing it.
					qc.invalidateQueries({ queryKey: qk.session(data.id) })
				} else {
					qc.setQueryData(qk.session(data.id), data)
				}
			}
			if (data._reused) {
				push({
					title: 'Resumed session',
					description: 'Continuing your in-progress workout.',
				})
			}
		},
		onError: (err: unknown) => {
			// Map backend 4xx errors to friendly messages
			const msg = err instanceof Error ? err.message : String(err)
			// Expected format: STATUS:<code>:<message>
			const m = msg.startsWith('STATUS:') ? msg.split(':') : []
			const code = m.length >= 3 ? Number(m[1]) : NaN
			const serverMessage = m.length >= 3 ? m.slice(2).join(':') : msg

			if (!Number.isNaN(code) && code >= 400 && code < 500) {
				let friendly = serverMessage
				if (code === 404) {
					friendly = 'The routine or routine day was not found.'
				}
				push({ title: 'Cannot start session', description: friendly })
				return
			}
			// Fallback
			push({
				title: 'Cannot start session',
				description: 'Unexpected error. Please try again.',
			})
		},
	})
}

export const useFinishSession = (id: string) => {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (data: FinishWorkoutRequest) =>
			workoutService.finishSession(id, data),
		onSuccess: (result: FinishWorkoutResponse) => {
			qc.setQueryData(qk.session(id), result.session)
			if (result.recap) qc.setQueryData(qk.recap(id), result.recap)
			qc.invalidateQueries({ queryKey: qk.active })
			qc.invalidateQueries({ queryKey: qk.stats })
			qc.invalidateQueries({ queryKey: qk.progress })
		},
	})
}

export const useUpsertSetLog = (id: string) => {
	const qc = useQueryClient()
	const { push } = useToast()
	const weightUnit = useWeightUnit()
	return useMutation({
		// Serialize all set-log writes for this session. Editing reps/weight fires a
		// debounced upsert (carrying the current isCompleted), and the completion
		// checkbox fires an immediate upsert — without a shared scope these are
		// independent writes to the same row and can race, so a reps/weight save
		// (isCompleted:false) can land after the completion save (isCompleted:true)
		// and clobber it on the server, leaving the set showing as not completed.
		scope: { id: `set-log:${id}` },
		mutationFn: async (
			data: UpsertSetLogRequest,
		): Promise<UpsertSetLogResponse> => {
			// Mark as pending (user modified fields) right before network
			setSaveState(
				`set:${id}:${data.routineExerciseId}:${data.setNumber}`,
				'saving',
			)
			const result = await workoutService.upsertSetLog(id, data)
			return result
		},
		onMutate: async (data: UpsertSetLogRequest) => {
			// Mark as saving for immediate UI feedback
			setSaveState(
				`set:${id}:${data.routineExerciseId}:${data.setNumber}`,
				'saving',
			)

			// Optimistically update the session cache
			await qc.cancelQueries({ queryKey: qk.session(id) })
			const previous = qc.getQueryData<WorkoutSession>(qk.session(id))
			if (previous) {
				const now = new Date().toISOString()
				const existing = (previous.setLogs ?? []).find(
					(l: SetLog) =>
						l.routineExerciseId === data.routineExerciseId &&
						l.setNumber === data.setNumber,
				)
				const updatedSetLogs: SetLog[] = existing
					? (previous.setLogs ?? []).map((l: SetLog) =>
							l.routineExerciseId === data.routineExerciseId &&
							l.setNumber === data.setNumber
								? {
										...l,
										reps: data.reps,
										weight: data.weight,
										// The server leaves an omitted RPE as it was.
										rpe: data.rpe ?? l.rpe,
										kind: data.kind ?? l.kind,
										isCompleted:
											typeof data.isCompleted === 'boolean'
												? data.isCompleted
												: l.isCompleted,
										updatedAt: now,
									}
								: l,
						)
					: [
							...(previous.setLogs ?? []),
							{
								id: `optimistic:${id}:${data.routineExerciseId}:${data.setNumber}`,
								sessionId: id,
								routineExerciseId: data.routineExerciseId,
								exerciseId: data.exerciseId,
								setNumber: data.setNumber,
								reps: data.reps,
								weight: data.weight,
								rpe: data.rpe ?? null,
								// Omitted, the row keeps its prescription's kind (LIVE-12).
								kind: data.kind,
								isCompleted: !!data.isCompleted,
								createdAt: now,
								updatedAt: now,
							} as SetLog,
						]

				const next: WorkoutSession = {
					...previous,
					setLogs: updatedSetLogs,
				}
				qc.setQueryData(qk.session(id), next)
			}

			return { previous } as { previous?: WorkoutSession }
		},
		onSuccess: (res, data) => {
			const savedSet = res.setLog
			const activityAt = new Date().toISOString()
			setSaveState(
				`set:${id}:${data.routineExerciseId}:${data.setNumber}`,
				'saved',
			)
			// Reconcile in place with the row the server just returned, instead of
			// invalidating and refetching the whole session.
			//
			// This used to invalidate TWICE (here and in onSettled), so every
			// autosave keystroke triggered a full `GET /workouts/sessions/{id}`,
			// which produced a new `setLogs` array, which recomputed `groupedLogs`,
			// which re-rendered every ExerciseGroup and SetLogInput on screen — on
			// the app's most interactive page, while the user is typing.
			//
			// The mutation response includes the complete SetLog and commits a session
			// heartbeat in the same transaction. Mirror that timestamp locally so a long-open
			// page cannot trigger stale recovery after successful activity. This also
			// replaces the synthetic `optimistic:` id with the real one. See TD-07.
			qc.setQueryData<WorkoutSession>(qk.session(id), prev => {
				if (!prev) return prev
				return {
					...prev,
					lastActivityAt: activityAt,
					setLogs: (prev.setLogs ?? []).map((l: SetLog) =>
						l.routineExerciseId === data.routineExerciseId &&
						l.setNumber === data.setNumber
							? savedSet
							: l,
					),
				}
			})
			qc.setQueryData<WorkoutSession | null>(qk.active, prev =>
				prev?.id === id ? { ...prev, lastActivityAt: activityAt } : prev,
			)

			const celebration = buildPersonalRecordCelebration(
				res.earnedRecords,
				weightUnit,
			)
			if (celebration) {
				push({ ...celebration, variant: 'success', duration: 6000 })
			}
		},
		onError: (_err, data, ctx) => {
			setSaveState(
				`set:${id}:${data.routineExerciseId}:${data.setNumber}`,
				'error',
			)
			if (ctx?.previous) {
				qc.setQueryData(qk.session(id), ctx.previous)
			}
			// Resync with the server only when the write failed. On success the
			// cache already holds the server's own row (see onSuccess), so the
			// refetch that used to live in onSettled had nothing to correct.
			qc.invalidateQueries({ queryKey: qk.session(id) })
		},
	})
}

/**
 * LIVE-11: swap the exercise for one slot of the active session. The server
 * returns the whole session (drafts for the slot are cleared), so it replaces
 * the cache; the routine is refetched only when it was changed too.
 */
export const useSubstituteExercise = (id: string, routineId?: string) => {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({
			routineExerciseId,
			...data
		}: SubstituteSessionExerciseRequest & { routineExerciseId: string }) =>
			workoutService.substituteExercise(id, routineExerciseId, data),
		onSuccess: (result: SubstituteSessionExerciseResponse) => {
			qc.setQueryData(qk.session(id), result.session as WorkoutSession)
			if (result.routineUpdated && routineId) {
				qc.invalidateQueries({ queryKey: routineQueryKeys.detail(routineId) })
			}
		},
	})
}

export const useRevertExerciseSubstitution = (id: string) => {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (routineExerciseId: string) =>
			workoutService.revertExerciseSubstitution(id, routineExerciseId),
		onSuccess: (result: SubstituteSessionExerciseResponse) => {
			qc.setQueryData(qk.session(id), result.session as WorkoutSession)
		},
	})
}

export const useDeleteSetLog = (id: string) => {
	const qc = useQueryClient()
	return useMutation({
		// Share the upsert scope so deletes and upserts for the same session can't
		// race each other either.
		scope: { id: `set-log:${id}` },
		mutationFn: ({
			routineExerciseId,
			setNumber,
		}: {
			routineExerciseId: string
			setNumber: number
		}) => workoutService.deleteSetLog(id, routineExerciseId, setNumber),
		onMutate: async (vars: {
			routineExerciseId: string
			setNumber: number
		}) => {
			await qc.cancelQueries({ queryKey: qk.session(id) })
			const previous = qc.getQueryData<WorkoutSession>(qk.session(id))
			if (previous) {
				const next: WorkoutSession = {
					...previous,
					setLogs: (previous.setLogs ?? []).filter(
						(l: SetLog) =>
							!(
								l.routineExerciseId === vars.routineExerciseId &&
								l.setNumber === vars.setNumber
							),
					),
				}
				qc.setQueryData(qk.session(id), next)
			}
			return { previous } as { previous?: WorkoutSession }
		},
		onError: (
			_err: unknown,
			_vars: { routineExerciseId: string; setNumber: number },
			ctx: { previous?: WorkoutSession } | undefined,
		) => {
			if (ctx?.previous) {
				qc.setQueryData(qk.session(id), ctx.previous)
			}
		},
		onSuccess: () => {
			const activityAt = new Date().toISOString()
			qc.setQueryData<WorkoutSession>(qk.session(id), prev =>
				prev ? { ...prev, lastActivityAt: activityAt } : prev,
			)
			qc.setQueryData<WorkoutSession | null>(qk.active, prev =>
				prev?.id === id ? { ...prev, lastActivityAt: activityAt } : prev,
			)
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: qk.session(id) })
		},
	})
}
