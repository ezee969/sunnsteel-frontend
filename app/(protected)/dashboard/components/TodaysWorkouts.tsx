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
import { useRoutines } from '@/lib/api/hooks/useRoutines';
import {
  useActiveSession,
  useStartSession,
} from '@/lib/api/hooks/useWorkoutSession';
import { getTodayDow, weekdayName } from '@/lib/utils/date';
import { Routine, RoutineDay } from '@/lib/api/types/routine.type';
import ClassicalIcon from '@/components/icons/ClassicalIcon';
import { cn } from '@/lib/utils';

export default function TodaysWorkouts() {
  const router = useRouter();
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
        return { routine: r, day } as { routine: Routine; day: RoutineDay };
      })
      .filter((x): x is { routine: Routine; day: RoutineDay } => Boolean(x));
  }, [routines, todayDow]);

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

  if (!todays.length) {
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
            {todays.length === 1
              ? 'You have 1 workout planned.'
              : `You have ${todays.length} workouts planned.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {todays.map(({ routine, day }) => {
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
                    disabled={isPending}
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
