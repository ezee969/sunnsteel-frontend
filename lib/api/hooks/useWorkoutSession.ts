import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export const useStartSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: StartWorkoutRequest) => {
      // 1) Reuse only an actually active session
      console.debug('[start-session] checking existing active session');
      const existing = await workoutService.getActiveSession();
      if (existing?.status === 'IN_PROGRESS' && existing.id) {
        console.debug('[start-session] found existing active session', existing.id);
        return existing;
      }

      // 2) Start a new session. Some backends may return 201 with empty body.
      let started: WorkoutSession | undefined;
      try {
        console.debug('[start-session] POST /sessions/start', data);
        started = await workoutService.startSession(data);
      } catch {
        // ignore body parsing issues; we'll poll active next
      }
      if (started?.id) {
        console.debug('[start-session] start returned id', started.id);
        return started;
      }

      // 3) Poll the active session briefly to obtain the new session id (handles async persistence)
      for (let i = 0; i < 3; i++) {
        console.debug('[start-session] polling active attempt', i + 1);
        const created = await workoutService.getActiveSession();
        if (created?.id) return created;
        await new Promise((r) => setTimeout(r, 250));
      }

      // Last attempt
      console.debug('[start-session] last attempt to get active session');
      const fallback = await workoutService.getActiveSession();
      return fallback as WorkoutSession;
    },
    onSuccess: (data: WorkoutSession | undefined) => {
      if (!data) return;
      qc.setQueryData(qk.active, data);
      if (data.id) {
        qc.setQueryData(qk.session(data.id), data);
      }
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
    onMutate: (data: UpsertSetLogRequest) => {
      setSaveState(
        `set:${id}:${data.routineExerciseId}:${data.setNumber}`,
        'saving'
      )
    },
    onSuccess: (_res, data) => {
      setSaveState(
        `set:${id}:${data.routineExerciseId}:${data.setNumber}`,
        'saved'
      )
      qc.invalidateQueries({ queryKey: qk.session(id) })
    },
    onError: (_err, data) => {
      setSaveState(
        `set:${id}:${data.routineExerciseId}:${data.setNumber}`,
        'error'
      )
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
