import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workoutService } from '../services/workoutService';
import { useAuth } from '@/providers/auth-provider';
import {
  FinishWorkoutRequest,
  StartWorkoutRequest,
  UpsertSetLogRequest,
  WorkoutSession,
  SetLog,
  ListSessionsParams,
  WorkoutSessionSummary,
} from '../types/workout.type';

const qk = {
  active: ['workout', 'session', 'active'] as const,
  session: (id: string) => ['workout', 'session', id] as const,
  sessions: (params: Omit<ListSessionsParams, 'cursor' | 'limit'>) =>
    ['workout', 'sessions', params] as const,
};

export const useActiveSession = () => {
  const { isAuthenticated, hasTriedRefresh } = useAuth();
  return useQuery({
    queryKey: qk.active,
    queryFn: () => workoutService.getActiveSession(),
    enabled: hasTriedRefresh && isAuthenticated,
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
  const { isAuthenticated, hasTriedRefresh } = useAuth();
  const { limit = 20, ...rest } = params;
  return useInfiniteQuery<{
    items: WorkoutSessionSummary[];
    nextCursor?: string;
  }>(
    {
      queryKey: qk.sessions(rest),
      queryFn: ({ pageParam }) =>
        workoutService.listSessions({ ...rest, cursor: pageParam as string | undefined, limit }),
      initialPageParam: undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: hasTriedRefresh && isAuthenticated,
    },
  );
};

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
    onSuccess: (data) => {
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
    onSuccess: (session) => {
      qc.setQueryData(qk.session(id), session);
      qc.invalidateQueries({ queryKey: qk.active });
    },
  });
};

export const useUpsertSetLog = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertSetLogRequest): Promise<SetLog> =>
      workoutService.upsertSetLog(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.session(id) });
    },
  });
};

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
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: qk.session(id) });
      const previous = qc.getQueryData<WorkoutSession>(qk.session(id));
      if (previous) {
        const next: WorkoutSession = {
          ...previous,
          setLogs: (previous.setLogs ?? []).filter(
            (l) =>
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
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(qk.session(id), ctx.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.session(id) });
    },
  });
};
