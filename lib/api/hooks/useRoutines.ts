import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { routineService } from '../services/routineService';
import { CreateRoutineRequest, Routine } from '../types/routine.type';

const ROUTINES_QUERY_KEY = ['routines'] as const;

export const useRoutines = (filters?: {
  isFavorite?: boolean;
  isCompleted?: boolean;
}) => {
  return useQuery<Routine[], Error>({
    queryKey: [...ROUTINES_QUERY_KEY, filters ?? {}],
    queryFn: () => routineService.getUserRoutines(filters),
  });
};

type ToggleFavoriteContext = {
  previousList?: Routine[];
  previousItem?: Routine;
};

export const useToggleRoutineFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation<Routine, Error, { id: string; isFavorite: boolean }, ToggleFavoriteContext>(
    {
      mutationFn: ({ id, isFavorite }) =>
        routineService.toggleFavorite(id, isFavorite),
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: ROUTINES_QUERY_KEY });

        // Snapshot of one base list (optional)
        const previousList = queryClient.getQueryData<Routine[]>(ROUTINES_QUERY_KEY);

        // Optimistically update all routines lists (any filters)
        queryClient.setQueriesData<Routine[]>
          ({ queryKey: ROUTINES_QUERY_KEY }, (old) =>
            (old ?? []).map((r) =>
              r.id === variables.id ? { ...r, isFavorite: variables.isFavorite } : r,
            ),
          );

        // Also optimistically update individual routine cache if present
        const routineKey = [...ROUTINES_QUERY_KEY, variables.id];
        const previousItem = queryClient.getQueryData<Routine>(routineKey);
        if (previousItem) {
          queryClient.setQueryData<Routine>(routineKey, (old) =>
            old ? { ...old, isFavorite: variables.isFavorite } : old,
          );
        }

        return { previousList, previousItem } as ToggleFavoriteContext;
      },
      onError: (_err, variables, context: ToggleFavoriteContext | undefined) => {
        if (context && context.previousList) {
          queryClient.setQueryData<Routine[]>(ROUTINES_QUERY_KEY, context.previousList);
        }
        if (context && context.previousItem) {
          queryClient.setQueryData<Routine>(
            [...ROUTINES_QUERY_KEY, variables.id],
            context.previousItem,
          );
        }
      },
      onSettled: (_data, _error, variables) => {
        queryClient.invalidateQueries({ queryKey: ROUTINES_QUERY_KEY });
        queryClient.invalidateQueries({
          queryKey: [...ROUTINES_QUERY_KEY, variables.id],
        });
      },
    },
  );
};

type ToggleCompletedContext = ToggleFavoriteContext;

export const useToggleRoutineCompleted = () => {
  const queryClient = useQueryClient();

  return useMutation<Routine, Error, { id: string; isCompleted: boolean }, ToggleCompletedContext>({
    mutationFn: ({ id, isCompleted }) => routineService.toggleCompleted(id, isCompleted),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ROUTINES_QUERY_KEY });

      const previousList = queryClient.getQueryData<Routine[]>(ROUTINES_QUERY_KEY);

      queryClient.setQueriesData<Routine[]>({ queryKey: ROUTINES_QUERY_KEY }, (old) =>
        (old ?? []).map((r) => (r.id === variables.id ? { ...r, isCompleted: variables.isCompleted } : r)),
      );

      const routineKey = [...ROUTINES_QUERY_KEY, variables.id];
      const previousItem = queryClient.getQueryData<Routine>(routineKey);
      if (previousItem) {
        queryClient.setQueryData<Routine>(routineKey, (old) =>
          old ? { ...old, isCompleted: variables.isCompleted } : old,
        );
      }

      return { previousList, previousItem } as ToggleCompletedContext;
    },
    onError: (_err, variables, context) => {
      if (context && context.previousList) {
        queryClient.setQueryData<Routine[]>(ROUTINES_QUERY_KEY, context.previousList);
      }
      if (context && context.previousItem) {
        queryClient.setQueryData<Routine>([...ROUTINES_QUERY_KEY, variables.id], context.previousItem);
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ROUTINES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...ROUTINES_QUERY_KEY, variables.id] });
    },
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
    onSuccess: (_: void, id: string) => {
      // Immediately remove from any cached routines lists (any filters)
      queryClient.setQueriesData<Routine[]>({ queryKey: ROUTINES_QUERY_KEY }, (old) =>
        (old ?? []).filter((r) => r.id !== id),
      );

      // Remove individual routine cache if present
      queryClient.removeQueries({ queryKey: [...ROUTINES_QUERY_KEY, id] });

      // Finally, invalidate lists to refetch from server and ensure consistency
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
