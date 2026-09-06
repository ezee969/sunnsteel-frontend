'use client';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { EmptyRoutinesState } from '@/features/routines/components/EmptyRoutinesState';
import { RoutineCard } from '@/features/routines/components/RoutineCard';
import { Loader2 } from 'lucide-react';

interface WorkoutsListProps {
  routines: Routine[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Render a scrollable list of routine cards, handling loading, error, empty states, and a delete confirmation dialog.
 *
 * @param routines - The list of routines to display; if `undefined` or empty, an empty state is shown.
 * @param isLoading - When `true`, renders a skeleton placeholder list instead of routines.
 * @param error - If provided, renders an error message describing the failure.
 * @returns The component's rendered UI as a React element.
 */
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

  if (!routines || routines.length === 0) {
    return <EmptyRoutinesState />;
  }

  return (
    <div className="h-full">
      <ScrollArea className="h-[calc(100vh-300px)] sm:h-[calc(100vh-350px)] lg:h-[calc(100vh-300px)]">
        <div className="grid gap-3 px-1 sm:gap-4 sm:pr-4 sm:pl-0">
          {routines.map((routine) => {
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
      </ScrollArea>

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
