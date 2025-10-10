'use client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { Routine } from '@/lib/api/types/routine.type';
import { useActiveSession } from '@/lib/api/hooks/useWorkoutSession';
import { useRoutineListActions } from '@/features/routines/hooks/useRoutineListActions';
import { RoutinesSkeletonList } from '@/features/routines/components/RoutinesSkeletonList';
import { RoutineCard } from '@/features/routines/components/RoutineCard';
import { EmptyRoutinesState } from '@/features/routines/components/EmptyRoutinesState';
import {
  ROUTINE_MOCKS,
  ROUTINE_MOCKS_ENABLED,
} from '@/features/routines/mocks/mock-routines';
import { Loader2 } from 'lucide-react';

interface WorkoutsListProps {
  routines: Routine[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

export default function WorkoutsList({
  routines,
  isLoading,
  error,
}: WorkoutsListProps) {
  const {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    favoriteActingId,
    completedActingId,
    startActingId,
    lastStartReused,
    isDeleting,
    isTogglingFavorite,
    isTogglingCompleted,
    isStarting,
    handleDeleteClick,
    handleConfirmDelete,
    handleToggleFavorite,
    handleToggleCompleted,
    handleStartSessionForRoutine,
  } = useRoutineListActions();
  const { data: activeSession } = useActiveSession();

  

  if (isLoading) {
    return <RoutinesSkeletonList />;
  }

  if (error) {
    return <p className="text-destructive">Error: {error.message}</p>;
  }

  const shouldUseMocks = ROUTINE_MOCKS_ENABLED && (!routines || routines.length === 0);
  const displayedRoutines = shouldUseMocks ? ROUTINE_MOCKS : routines ?? [];

  if (!shouldUseMocks && displayedRoutines.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <EmptyRoutinesState />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 h-full flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="grid gap-3 px-1 pb-4 sm:gap-4 sm:pr-4 sm:pl-0">
          {displayedRoutines.map((routine) => {
            const isActiveRoutine =
              activeSession?.status === 'IN_PROGRESS' &&
              activeSession?.routineId === routine.id;

            return (
              <RoutineCard
                key={routine.id}
                routine={routine}
                isActiveRoutine={isActiveRoutine}
                activeSessionId={activeSession?.id}
                onStartSession={handleStartSessionForRoutine}
                onToggleCompleted={handleToggleCompleted}
                onToggleFavorite={handleToggleFavorite}
                onDelete={handleDeleteClick}
                isStarting={isStarting}
                startActingId={startActingId}
                lastStartReused={lastStartReused}
                isTogglingCompleted={isTogglingCompleted}
                completedActingId={completedActingId}
                isTogglingFavorite={isTogglingFavorite}
                favoriteActingId={favoriteActingId}
              />
            );
          })}
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your routine
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive  hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
