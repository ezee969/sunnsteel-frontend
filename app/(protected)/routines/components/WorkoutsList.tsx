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
import { MoreVertical, PlusCircle, Loader2, Heart, ListChecks } from 'lucide-react';
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
import { routineService } from '@/lib/api/services/routineService';
import { weeksRemainingFromEndDate } from '@/lib/utils/date';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ClassicalIcon } from '@/components/icons/ClassicalIcon';

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

  const isProgramEnded = (routine: Routine | undefined): boolean => {
    if (!routine?.programEndDate) return false;
    const today = new Date();
    const todayUTC = Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const end = new Date(routine.programEndDate);
    const endUTC = Date.UTC(
      end.getUTCFullYear(),
      end.getUTCMonth(),
      end.getUTCDate()
    );
    return todayUTC > endUTC;
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

  const handleStartSessionForRoutine = async (
    routine: Routine,
    routineDayId?: string
  ) => {
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
      const session = await startSession({
        routineId: routine.id,
        routineDayId: dayId,
      });
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
      <div className="px-1 sm:pr-4 sm:pl-0">
        <div className="grid gap-3 sm:gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="p-4 sm:px-6 sm:py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2 pr-4">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-60" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:px-6 sm:pb-4 sm:pt-0">
                <div className="space-y-2 mb-3">
                  <Skeleton className="h-3 w-full" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
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
        <Button asChild variant="classical">
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
                  {isProgramEnded(routine) && (
                    <Badge variant="outline" className="mr-1">
                      Program ended
                    </Badge>
                  )}
                  {!isProgramEnded(routine) && routine.programEndDate && (
                    <Badge variant="classical" className="mr-1">
                      {weeksRemainingFromEndDate(routine.programEndDate)} weeks left
                    </Badge>
                  )}
                  <Button
                    type="button"
                    variant="classical"
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
                    disabled={
                      (isStarting && startActingId === routine.id) ||
                      isProgramEnded(routine)
                    }
                  >
                    {isStarting && startActingId === routine.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ClassicalIcon
                        name="dumbbell"
                        className="mr-2 h-4 w-4"
                        aria-hidden
                      />
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
                              onSelect={() =>
                                handleStartSessionForRoutine(routine, d.id)
                              }
                              disabled={
                                (isStarting && startActingId === routine.id) ||
                                isProgramEnded(routine)
                              }
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
                <div className="space-y-1 mb-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Completion</span>
                    <span>{routine.isCompleted ? '100%' : '0%'}</span>
                  </div>
                  <Progress variant="gold" value={routine.isCompleted ? 100 : 0} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 text-xs sm:text-sm"
                  >
                    <ClassicalIcon
                      name="dumbbell"
                      className="h-3 w-3 flex-shrink-0"
                      aria-hidden
                    />
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
