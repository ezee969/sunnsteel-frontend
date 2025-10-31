'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Dumbbell, ChevronRight, CalendarDays, Calendar } from 'lucide-react';
import { useComponentPreloading } from '@/lib/utils/dynamic-imports';
import { useRoutines } from '@/lib/api/hooks/useRoutines';
import {
  useActiveSession,
  useStartSession,
  useSessions,
} from '@/lib/api/hooks/useWorkoutSession';
import { getTodayDow, weekdayName, validateRoutineDayDate } from '@/lib/utils/date';
import { Routine, RoutineDay } from '@/lib/api/types/routine.type';
import ClassicalIcon from '@/components/icons/ClassicalIcon';
import { cn } from '@/lib/utils';

export default function TodaysWorkouts() {
  const router = useRouter();
  const { preloadOnHover } = useComponentPreloading();
  const { data: routines, isLoading, error } = useRoutines();
  const { data: active } = useActiveSession();
  const { mutateAsync: startSession, isPending } = useStartSession();

  const todayDow = getTodayDow();
  const [activeConflictOpen, setActiveConflictOpen] = useState(false);

  const todays = useMemo(() => {
    return (routines ?? [])
      .map((r: Routine) => {
        const day = r.days?.find((d: RoutineDay) => d.dayOfWeek === todayDow);
        if (!day) return null;
        
        // Validate if this routine day can be started today based on scheduling rules
        const validation = validateRoutineDayDate(day);
        const canStartToday = validation.isValid;
        
        return { routine: r, day, canStartToday } as { routine: Routine; day: RoutineDay; canStartToday: boolean };
      })
      .filter((x): x is { routine: Routine; day: RoutineDay; canStartToday: boolean } => Boolean(x));
  }, [routines, todayDow]);

  // Determine today's local ISO range
  const fromISO = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);
  const toISO = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }, []);

  // Fetch today's completed sessions and build a set of routineIds completed today
  const completedTodayQuery = useSessions({
    status: 'COMPLETED',
    from: fromISO,
    to: toISO,
    sort: 'finishedAt:desc',
    limit: 50,
  });

  const completedRoutineIds = useMemo(() => {
    const pages = completedTodayQuery.data?.pages ?? [];
    const items = pages.flatMap(p => p.items ?? []);
    return new Set(items.map(i => i.routine.id));
  }, [completedTodayQuery.data]);

  // Filter out routines that already have a completed session today
  const visibleTodays = useMemo(() => {
    if (!todays.length) return todays;
    if (!completedRoutineIds.size) return todays;
    return todays.filter(({ routine }) => !completedRoutineIds.has(routine.id));
  }, [todays, completedRoutineIds]);

  const handleStart = async (routineId: string, routineDayId: string) => {
    if (!routineId || !routineDayId) return;

    if (active?.id && active.routineDayId !== routineDayId) {
      setActiveConflictOpen(true);
      return;
    }

    const session = await startSession({ routineId, routineDayId });
    if (session?.id) router.push(`/workouts/sessions/${session.id}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today’s Workouts</CardTitle>
          <CardDescription>
            Fetching your plan for {weekdayName(todayDow, 'long')}…
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return <p className="text-destructive">Error: {error.message}</p>;
  }

  if (!visibleTodays.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            No workouts scheduled today
          </CardTitle>
          <CardDescription>
            You don’t have any routines planned for {weekdayName(todayDow, 'long')}.
            Start one from your routines.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild aria-label="Go to routines">
            <Link href="/routines">
              <ClassicalIcon
                name={'scroll-unfurled'}
                aria-hidden
                className={cn('h-4 w-4 transition-all', 'text-primary-foreground')}
              />
              Browse Routines
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Today’s Workouts</CardTitle>
          <CardDescription>
            {visibleTodays.length === 1
              ? 'You have 1 workout planned.'
              : `You have ${visibleTodays.length} workouts planned.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {visibleTodays.map(({ routine, day, canStartToday }) => {
            const isActiveForThis =
              active?.status === 'IN_PROGRESS' && active?.routineDayId === day.id;
            return (
              <div
                key={`${routine.id}:${day.id}`}
                className="rounded-md border p-3 sm:flex sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{routine.name}</span>
                    <Badge variant="classical">
                      <Calendar className="h-4 w-4" />
                      {weekdayName(day.dayOfWeek)}
                    </Badge>
                  </div>
                </div>
                <div className="mt-3 grid w-full grid-cols-2 gap-2 sm:mt-0 sm:ml-3 sm:flex sm:w-auto sm:shrink-0 sm:items-center sm:gap-2">
                  <Button
                    type="button"
                    className="w-full sm:w-auto"
                    variant="classical"
                    aria-label={isActiveForThis ? 'Resume workout' : 'Start workout'}
                    onClick={() =>
                      isActiveForThis && active?.id
                        ? router.push(`/workouts/sessions/${active.id}`)
                        : handleStart(routine.id, day.id)
                    }
                    disabled={isPending || (!isActiveForThis && !canStartToday)}
                    title={!canStartToday && !isActiveForThis ? `This workout is not scheduled for ${weekdayName(todayDow, 'long')}` : undefined}
                    {...preloadOnHover('activeWorkoutSession')}
                  >
                    <Dumbbell className="mr-2 h-4 w-4" />
                    {isActiveForThis ? 'Resume' : 'Start'}
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    aria-label="View details"
                    className="w-full sm:w-auto"
                  >
                    <Link href={`/routines/${routine.id}`}>
                      Details
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Active session conflict dialog */}
      <AlertDialog open={activeConflictOpen} onOpenChange={setActiveConflictOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Active workout in progress</AlertDialogTitle>
            <AlertDialogDescription>
              You already have an active session
              {active?.routine?.name ? ` for "${active.routine.name}"` : ''}. You can
              resume it now. Starting another workout is not supported while a
              session is in progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setActiveConflictOpen(false);
                if (active?.id) router.push(`/workouts/sessions/${active.id}`);
              }}
            >
              Go to Active Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
