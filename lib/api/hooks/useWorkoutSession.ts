import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/toast'
import { workoutService } from '../services/workoutService';
import { setSaveState } from '@/lib/utils/save-status-store';
// Temporary auth abstraction: migrate from legacy auth-provider to Supabase auth.
import { useAuth } from '@/providers/use-auth-adapter';
import {
  FinishWorkoutRequest,
  StartWorkoutRequest,
  UpsertSetLogRequest,
  WorkoutSession,
  SetLog,
  ListSessionsParams,
  WorkoutSessionSummary,
} from '../types/workout.type';

// Serialize params object to ensure stable query keys
function serializeSessionParams(params: Omit<ListSessionsParams, 'cursor' | 'limit'>) {
  if (!params || typeof params !== 'object') return 'no-params';
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b));
  
  if (!entries.length) return 'no-params';
  
  return entries.map(([k, v]) => {
    // Handle different value types
    if (typeof v === 'object') {
      return `${k}:${JSON.stringify(v)}`;
    }
    return `${k}:${v}`;
  }).join('|');
}

const qk = {
  active: ['workout', 'session', 'active'] as const,
  session: (id: string) => ['workout', 'session', id] as const,
  sessions: (params: Omit<ListSessionsParams, 'cursor' | 'limit'>) =>
    ['workout', 'sessions', serializeSessionParams(params)] as const,
};

export const useActiveSession = () => {
  const { isAuthenticated, isLoading } = useAuth();
  return useQuery({
    queryKey: qk.active,
    queryFn: () => workoutService.getActiveSession(),
    // Only run once auth is resolved and user is authenticated
    enabled: !isLoading && isAuthenticated,
  });
};

export const useSession = (id: string) => {
  return useQuery<WorkoutSession>({
    queryKey: qk.session(id),
    queryFn: () => workoutService.getSessionById(id),
    enabled: !!id,
  });
};

export const useSessions = (
  params: Omit<ListSessionsParams, 'cursor' | 'limit'> & { limit?: number },
) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { limit = 20, ...rest } = params;
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
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !isLoading && isAuthenticated,
  })
};
// Exposed utility to mark a set as locally dirty (pending) before debounce/autosave
export function markSetPending(sessionId: string, routineExerciseId: string, setNumber: number) {
  setSaveState(`set:${sessionId}:${routineExerciseId}:${setNumber}`,'pending')
}

// Module-scoped flag to prevent parallel start attempts across components/tabs (per tab)
let inFlightStart = false;

export const useStartSession = () => {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
  mutationFn: async (data: StartWorkoutRequest): Promise<(WorkoutSession & { _reused?: boolean }) | undefined> => {
      if (inFlightStart) {
        console.debug('[start-session] prevented parallel start attempt');
  const active = await workoutService.getActiveSession();
  return active ?? undefined;
      }
      inFlightStart = true;
      try {
        // 1) Reuse only an actually active session
        console.debug('[start-session] checking existing active session');
        const existing = await workoutService.getActiveSession();
        if (existing?.status === 'IN_PROGRESS' && existing.id) {
          console.debug('[start-session] found existing active session (reuse)', existing.id);
          // Mark reuse via side channel property (non-persistent)
          return { ...existing, _reused: true } as WorkoutSession & { _reused?: boolean };
        }

        // 2) Start a new session (backend enforces uniqueness). Some backends may return 201 with empty body.
        let started: WorkoutSession | undefined;
        try {
          console.debug('[start-session] POST /sessions/start', data);
          started = await workoutService.startSession(data);
        } catch (e) {
          console.debug('[start-session] start request threw, will poll active', e);
        }
        if (started?.id) {
          console.debug('[start-session] start returned id', started.id);
          return started;
        }

        // 3) Poll the active session briefly to obtain the new session id (handles async persistence / race fallback)
        for (let i = 0; i < 3; i++) {
          console.debug('[start-session] polling active attempt', i + 1);
          const created = await workoutService.getActiveSession();
          if (created?.id) return created;
          await new Promise((r) => setTimeout(r, 250));
        }

        // Last attempt
        console.debug('[start-session] last attempt to get active session');
        const fallback = await workoutService.getActiveSession();
        return fallback ?? undefined;
      } finally {
        inFlightStart = false;
      }
    },
    onSuccess: (data: (WorkoutSession & { _reused?: boolean }) | undefined) => {
      if (!data) return;
      qc.setQueryData(qk.active, data);
      if (data.id) {
        qc.setQueryData(qk.session(data.id), data);
      }
      if (data._reused) {
        push({
          title: 'Resumed session',
          description: 'Continuing your in-progress workout.',
        })
      }
      // Show RtF program info when available (new session or reused)
      if (data.program) {
        const wk = data.program.currentWeek
        const total = data.program.durationWeeks
        const deload = data.program.isDeloadWeek
        push({
          title: `Program Week ${wk} / ${total}`,
          description: deload ? 'Deload week' : 'Standard week',
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
        const lower = serverMessage.toLowerCase()
        if (lower.includes('weekday') || lower.includes('day mismatch')) {
          friendly = 'Program start date must match the first training weekday.'
        } else if (lower.includes('missing') && (lower.includes('timezone') || lower.includes('program'))) {
          friendly = 'Add start date and timezone for RtF programs.'
        } else if (lower.includes('out of range') || lower.includes('week') && lower.includes('range')) {
          friendly = 'Start week must be within the program’s valid range.'
        } else if (code === 404) {
          friendly = 'The routine or routine day was not found.'
        }
        push({ title: 'Cannot start session', description: friendly })
        return
      }
      // Fallback
      push({ title: 'Cannot start session', description: 'Unexpected error. Please try again.' })
    },
  });
};

export const useFinishSession = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FinishWorkoutRequest) =>
      workoutService.finishSession(id, data),
    onSuccess: (session: WorkoutSession) => {
      qc.setQueryData(qk.session(id), session);
      qc.invalidateQueries({ queryKey: qk.active });
    },
  });
};

export const useUpsertSetLog = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpsertSetLogRequest): Promise<SetLog> => {
      // Mark as pending (user modified fields) right before network
      setSaveState(
        `set:${id}:${data.routineExerciseId}:${data.setNumber}`,
        'saving'
      )
      const result = await workoutService.upsertSetLog(id, data)
      return result
    },
    onMutate: async (data: UpsertSetLogRequest) => {
      // Mark as saving for immediate UI feedback
      setSaveState(
        `set:${id}:${data.routineExerciseId}:${data.setNumber}`,
        'saving'
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
    onSuccess: (_res, data) => {
      setSaveState(
        `set:${id}:${data.routineExerciseId}:${data.setNumber}`,
        'saved'
      )
      qc.invalidateQueries({ queryKey: qk.session(id) })
    },
    onError: (_err, data, ctx) => {
      setSaveState(
        `set:${id}:${data.routineExerciseId}:${data.setNumber}`,
        'error'
      )
      if (ctx?.previous) {
        qc.setQueryData(qk.session(id), ctx.previous)
      }
    },
    onSettled: () => {
      // Ensure we sync with server truth
      qc.invalidateQueries({ queryKey: qk.session(id) })
    },
  })
}

export const useDeleteSetLog = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      routineExerciseId,
      setNumber,
    }: {
      routineExerciseId: string;
      setNumber: number;
    }) => workoutService.deleteSetLog(id, routineExerciseId, setNumber),
    onMutate: async (vars: { routineExerciseId: string; setNumber: number }) => {
      await qc.cancelQueries({ queryKey: qk.session(id) });
      const previous = qc.getQueryData<WorkoutSession>(qk.session(id));
      if (previous) {
        const next: WorkoutSession = {
          ...previous,
          setLogs: (previous.setLogs ?? []).filter(
            (l: SetLog) =>
              !(
                l.routineExerciseId === vars.routineExerciseId &&
                l.setNumber === vars.setNumber
              )
          ),
        };
        qc.setQueryData(qk.session(id), next);
      }
      return { previous } as { previous?: WorkoutSession };
    },
    onError: (_err: unknown, _vars: { routineExerciseId: string; setNumber: number }, ctx: { previous?: WorkoutSession } | undefined) => {
      if (ctx?.previous) {
        qc.setQueryData(qk.session(id), ctx.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.session(id) });
    },
  });
};
