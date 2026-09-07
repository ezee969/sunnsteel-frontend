import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { useToast } from '@/components/ui/toast'
import { logger } from '@/lib/utils/logger'
import { setSaveState } from '@/lib/utils/save-status-store'
// Temporary auth abstraction: migrate from legacy auth-provider to Supabase auth.
import { useSupabaseAuth as useAuth } from '@/providers/supabase-auth-provider'

import { workoutService } from '../services/workoutService'
import {
	FinishWorkoutRequest,
	ListSessionsParams,
	PreviousPerformanceResponse,
	SetLog,
	StartWorkoutRequest,
	UpsertSetLogRequest,
	WorkoutSession,
	WorkoutSessionSummary,
} from '../types/workout.type'
import { getWorkoutStatsQuery } from '../types/workout-stats.type'
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

const qk = {
	stats: ['workout', 'stats'] as const,
	progress: ['workout', 'progress'] as const,
	active: ['workout', 'session', 'active'] as const,
	session: (id: string) => ['workout', 'session', id] as const,
	previousPerformance: (id: string) =>
		['workout', 'session', id, 'previous-performance'] as const,
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

// Module-scoped flag to prevent parallel start attempts across components/tabs (per tab)
let inFlightStart = false

export const useStartSession = () => {
	const qc = useQueryClient()
	const { push } = useToast()
	return useMutation({
		mutationFn: async (
			data: StartWorkoutRequest,
		): Promise<(WorkoutSession & { _reused?: boolean }) | undefined> => {
			if (inFlightStart) {
				logger.debug('[start-session] prevented parallel start attempt')
				const active = await workoutService.getActiveSession()
				return active ?? undefined
			}
			inFlightStart = true
			try {
				// 1) Reuse only an actually active session
				logger.debug('[start-session] checking existing active session')
				const existing = await workoutService.getActiveSession()
				if (existing?.status === 'IN_PROGRESS' && existing.id) {
					logger.debug(
						'[start-session] found existing active session (reuse)',
						existing.id,
					)
					// Mark reuse via side channel property (non-persistent)
					return { ...existing, _reused: true } as WorkoutSession & {
						_reused?: boolean
					}
				}

				// 2) Start a new session (backend enforces uniqueness). Some backends may return 201 with empty body.
				let started: WorkoutSession | undefined
				try {
					logger.debug('[start-session] POST /sessions/start', data)
					started = await workoutService.startSession(data)
				} catch (e) {
					logger.debug(
						'[start-session] start request threw, will poll active',
						e,
					)
				}
				if (started?.id) {
					logger.debug('[start-session] start returned id', started.id)
					return started
				}

				// 3) Poll the active session briefly to obtain the new session id (handles async persistence / race fallback)
				for (let i = 0; i < 3; i++) {
					logger.debug('[start-session] polling active attempt', i + 1)
					const created = await workoutService.getActiveSession()
					if (created?.id) return created
					await new Promise(r => setTimeout(r, 250))
				}

				// Last attempt
				logger.debug('[start-session] last attempt to get active session')
				const fallback = await workoutService.getActiveSession()
				return fallback ?? undefined
			} finally {
				inFlightStart = false
			}
		},
		onSuccess: (data: (WorkoutSession & { _reused?: boolean }) | undefined) => {
			if (!data) return
			qc.setQueryData(qk.active, data)
			qc.invalidateQueries({ queryKey: qk.stats })
			if (data.id) {
				qc.setQueryData(qk.session(data.id), data)
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
		onSuccess: (session: WorkoutSession) => {
			qc.setQueryData(qk.session(id), session)
			qc.invalidateQueries({ queryKey: qk.active })
			qc.invalidateQueries({ queryKey: qk.stats })
			qc.invalidateQueries({ queryKey: qk.progress })
		},
	})
}

export const useUpsertSetLog = (id: string) => {
	const qc = useQueryClient()
	return useMutation({
		// Serialize all set-log writes for this session. Editing reps/weight fires a
		// debounced upsert (carrying the current isCompleted), and the completion
		// checkbox fires an immediate upsert — without a shared scope these are
		// independent writes to the same row and can race, so a reps/weight save
		// (isCompleted:false) can land after the completion save (isCompleted:true)
		// and clobber it on the server, leaving the set showing as not completed.
		scope: { id: `set-log:${id}` },
		mutationFn: async (data: UpsertSetLogRequest): Promise<SetLog> => {
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
			// Safe because the backend's upsertSetLog returns the complete SetLog
			// row and does not modify the session itself; it only reads it to
			// validate ownership and status. It also replaces the synthetic
			// `optimistic:` id that onMutate inserted with the real one. See TD-07.
			qc.setQueryData<WorkoutSession>(qk.session(id), prev => {
				if (!prev) return prev
				return {
					...prev,
					setLogs: (prev.setLogs ?? []).map((l: SetLog) =>
						l.routineExerciseId === data.routineExerciseId &&
						l.setNumber === data.setNumber
							? res
							: l,
					),
				}
			})
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
		onSettled: () => {
			qc.invalidateQueries({ queryKey: qk.session(id) })
		},
	})
}
