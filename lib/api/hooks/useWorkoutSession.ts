import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workoutService } from '../services/workoutService';
import {
  FinishWorkoutRequest,
  StartWorkoutRequest,
  UpsertSetLogRequest,
  WorkoutSession,
  SetLog,
} from '../types/workout.type';

const qk = {
  active: ['workout', 'session', 'active'] as const,
  session: (id: string) => ['workout', 'session', id] as const,
};

export const useActiveSession = () => {
  return useQuery({
    queryKey: qk.active,
    queryFn: () => workoutService.getActiveSession(),
  });
};

export const useSession = (id: string) => {
  return useQuery<WorkoutSession>({
    queryKey: qk.session(id),
    queryFn: () => workoutService.getSessionById(id),
    enabled: !!id,
  });
};

export const useStartSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: StartWorkoutRequest) => {
      const active = await workoutService.getActiveSession();
      if (active) {
        // If an active session exists, just return it to navigate
        return active;
      }
      return workoutService.startSession(data);
    },
    onSuccess: (data) => {
      qc.setQueryData(qk.active, data);
    },
  });
};

export const useFinishSession = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FinishWorkoutRequest) => workoutService.finishSession(id, data),
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
            (l) => !(l.routineExerciseId === vars.routineExerciseId && l.setNumber === vars.setNumber),
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
