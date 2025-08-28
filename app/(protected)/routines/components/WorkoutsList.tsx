'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dumbbell,
  MoreVertical,
  PlusCircle,
  Loader2,
  Heart,
  ListChecks,
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  useDeleteRoutine,
  useToggleRoutineFavorite,
  useToggleRoutineCompleted,
} from '@/lib/api/hooks/useRoutines';
import { useStartSession } from '@/lib/api/hooks/useWorkoutSession';
import { useRouter } from 'next/navigation';
import { ClipLoader } from 'react-spinners';
import { routineService } from '@/lib/api/services/routineService';

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
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [favoriteActingId, setFavoriteActingId] = useState<string | null>(null);
  const [completedActingId, setCompletedActingId] = useState<string | null>(null);
  const [startActingId, setStartActingId] = useState<string | null>(null);

  const { mutate: deleteRoutine, isPending: isDeleting } = useDeleteRoutine();
  const { mutate: toggleFavorite, isPending: isTogglingFavorite } =
    useToggleRoutineFavorite();
  const { mutate: toggleCompleted, isPending: isTogglingCompleted } =
    useToggleRoutineCompleted();
  const { mutateAsync: startSession, isPending: isStarting } = useStartSession();

  const dayName = (dayOfWeek: number) => {
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return names[dayOfWeek] ?? `Day ${dayOfWeek}`;
  };

  const handleDeleteClick = (routineId: string) => {
    setSelectedRoutineId(routineId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedRoutineId) {
      deleteRoutine(selectedRoutineId, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedRoutineId(null);
        },
      });
    }
  };

  const handleToggleFavorite = (routine: Routine) => {
    if (!routine?.id) return;
    setFavoriteActingId(routine.id);
    toggleFavorite(
      { id: routine.id, isFavorite: !routine.isFavorite },
      {
        onSettled: () => setFavoriteActingId(null),
      }
    );
  };

  const handleToggleCompleted = (routine: Routine) => {
    if (!routine?.id) return;
    setCompletedActingId(routine.id);
    toggleCompleted(
      { id: routine.id, isCompleted: !routine.isCompleted },
      {
        onSettled: () => setCompletedActingId(null),
      }
    );
  };

  const handleStartSessionForRoutine = async (routine: Routine, routineDayId?: string) => {
    try {
      setStartActingId(routine.id);
      let dayId = routineDayId ?? routine.days?.[0]?.id;
      if (!dayId) {
        // Fallback: fetch full routine details to get days
        console.debug('[start-session] fetching routine details to get day');
        const full = await routineService.getById(routine.id);
        dayId = full.days?.[0]?.id;
      }
      if (!dayId) {
        console.error('No routine day available to start a session');
        return;
      }
      const session = await startSession({ routineId: routine.id, routineDayId: dayId });
      if (session?.id) {
        router.push(`/workouts/sessions/${session.id}`);
      }
    } catch (err) {
      console.error('Failed to start session', err);
    } finally {
      setStartActingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <ClipLoader color="#3b82f6" size={40} />
          <p className="text-muted-foreground">Loading workouts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">Error: {error.message}</p>;
  }

  if (!routines || routines.length === 0) {
    return (
      <div className="flex h-[calc(100vh-300px)] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <h3 className="text-2xl font-bold tracking-tight">You have no routines</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get started by creating a new routine.
        </p>
        <Button asChild>
          <Link href="/routines/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Routine
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ScrollArea className="h-[calc(100vh-300px)] sm:h-[calc(100vh-350px)] lg:h-[calc(100vh-300px)]">
        <div className="grid gap-3 px-1 sm:gap-4 sm:pr-4 sm:pl-0">
          {routines.map((routine) => (
            <Card key={routine.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 sm:px-6 sm:py-4">
                <div className="space-y-1 pr-2">
                  <CardTitle className="text-base font-semibold sm:text-lg">
                    {routine.name}
                  </CardTitle>
                  {routine.description && (
                    <CardDescription className="line-clamp-2 text-sm sm:text-base">
                      {routine.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-8"
                    aria-label="Start session"
                    onClick={(e) => {
                      e.preventDefault();
                      void handleStartSessionForRoutine(routine);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        void handleStartSessionForRoutine(routine);
                      }
                    }}
                    disabled={isStarting && startActingId === routine.id}
                  >
                    {isStarting && startActingId === routine.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Dumbbell className="mr-2 h-4 w-4" />
                    )}
                    Start
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={
                      routine.isCompleted ? 'Unmark completed' : 'Mark as completed'
                    }
                    disabled
                    aria-pressed={routine.isCompleted}
                    onClick={() => handleToggleCompleted(routine)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggleCompleted(routine);
                      }
                    }}
                    // disabled={
                    //   isTogglingCompleted && completedActingId === routine.id
                    // }
                  >
                    {isTogglingCompleted && completedActingId === routine.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                    ) : (
                      <ListChecks
                        className="h-4 w-4 text-emerald-600"
                        fill={routine.isCompleted ? 'currentColor' : 'none'}
                      />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={
                      routine.isFavorite ? 'Unmark favorite' : 'Mark as favorite'
                    }
                    aria-pressed={routine.isFavorite}
                    onClick={() => handleToggleFavorite(routine)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggleFavorite(routine);
                      }
                    }}
                    disabled={isTogglingFavorite && favoriteActingId === routine.id}
                  >
                    {isTogglingFavorite && favoriteActingId === routine.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                    ) : (
                      <Heart
                        className="h-4 w-4 text-rose-500"
                        fill={routine.isFavorite ? 'currentColor' : 'none'}
                      />
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {routine.days.length > 0 && (
                        <>
                          <DropdownMenuItem className="pointer-events-none opacity-60">
                            Start session with day
                          </DropdownMenuItem>
                          {routine.days.map((d) => (
                            <DropdownMenuItem
                              key={d.id}
                              onSelect={() => handleStartSessionForRoutine(routine, d.id)}
                              disabled={isStarting && startActingId === routine.id}
                            >
                              {dayName(d.dayOfWeek)}
                            </DropdownMenuItem>
                          ))}
                          <div className="my-1 h-px bg-border" />
                        </>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href={`/routines/${routine.id}`}>Open</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/routines/edit/${routine.id}`}>Edit</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onSelect={() => handleDeleteClick(routine.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:px-6 sm:pb-4 sm:pt-0">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 text-xs sm:text-sm"
                  >
                    <Dumbbell className="h-3 w-3 flex-shrink-0" />
                    <span>{routine.days.length} days/week</span>
                  </Badge>
                  {routine.isPeriodized && (
                    <Badge variant="outline" className="text-xs sm:text-sm">
                      Periodized
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
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
