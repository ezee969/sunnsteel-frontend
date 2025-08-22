import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { routineService } from '../services/routineService';
import { CreateRoutineRequest, Routine } from '../types/routine.type';

const ROUTINES_QUERY_KEY = ['routines'] as const;

export const useRoutines = () => {
  return useQuery<Routine[], Error>({
    queryKey: ROUTINES_QUERY_KEY,
    queryFn: routineService.getUserRoutines,
  });
};

export const useRoutine = (id: string) => {
  return useQuery<Routine, Error>({
    queryKey: [...ROUTINES_QUERY_KEY, id],
    queryFn: () => routineService.getById(id),
    enabled: !!id,
  });
};

export const useDeleteRoutine = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id: string) => routineService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROUTINES_QUERY_KEY });
      // TODO: Add toast notification for success
    },
    onError: (error: Error) => {
      // TODO: Add toast notification for error
      console.error('Error deleting routine:', error);
    },
  });
};

export const useCreateRoutine = () => {
  const queryClient = useQueryClient();

  return useMutation<Routine, Error, CreateRoutineRequest>({
    mutationFn: (data: CreateRoutineRequest) => routineService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROUTINES_QUERY_KEY });
    },
  });
};

export const useUpdateRoutine = () => {
  const queryClient = useQueryClient();

  return useMutation<Routine, Error, { id: string; data: CreateRoutineRequest }>({
    mutationFn: ({ id, data }: { id: string; data: CreateRoutineRequest }) =>
      routineService.update(id, data),
    onSuccess: (_: Routine, variables: { id: string }) => {
      // Invalidate both the routines list and the specific routine
      queryClient.invalidateQueries({ queryKey: ROUTINES_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...ROUTINES_QUERY_KEY, variables.id],
      });
    },
  });
};
