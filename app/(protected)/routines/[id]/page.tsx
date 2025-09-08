'use client';

import { useParams, useRouter } from 'next/navigation';
import { useRoutine } from '@/lib/api/hooks/useRoutines';
import {
  useActiveSession,
  useStartSession,
} from '@/lib/api/hooks/useWorkoutSession';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
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
import { getTodayDow, weekdayName, weeksRemainingFromEndDate } from '@/lib/utils/date';
import type { RoutineDay, RoutineSet } from '@/lib/api/types/routine.type';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const dayName = (dayOfWeek: number) => {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return names[dayOfWeek] ?? `Day ${dayOfWeek}`;
};

const isProgramEnded = (programEndDate?: string): boolean => {
  if (!programEndDate) return false;
  const today = new Date();
  const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(programEndDate);
  const endUTC = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  return todayUTC > endUTC;
};

export default function RoutineDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const routineId = params?.id as string;

  const { data: routine, isLoading, error } = useRoutine(routineId);
  const { mutateAsync: startSession, isPending: isStarting } = useStartSession();
  const [startActingDayId, setStartActingDayId] = useState<string | null>(null);
  const { data: active } = useActiveSession();
  const [activeConflictOpen, setActiveConflictOpen] = useState(false);
  const [dateConfirmOpen, setDateConfirmOpen] = useState(false);
  const [pendingDayId, setPendingDayId] = useState<string | null>(null);
  const todayDow = getTodayDow();

  const firstDayId = useMemo(() => routine?.days?.[0]?.id, [routine?.days]);
  const todayDayId = useMemo(
    () => routine?.days?.find((d) => d.dayOfWeek === todayDow)?.id,
    [routine?.days, todayDow]
  );
  const quickStartDayId = todayDayId ?? firstDayId;

  const proceedStart = async (routineDayId?: string) => {
    if (!routineId || !routineDayId) return;
    try {
      setStartActingDayId(routineDayId);
      const session = await startSession({ routineId, routineDayId });
      if (session?.id) router.push(`/workouts/sessions/${session.id}`);
    } catch (e) {
      console.error('Failed to start session', e);
    } finally {
      setStartActingDayId(null);
    }
  };

  const handleStart = (routineDayId?: string) => {
    if (!routineId || !routineDayId || !routine?.days) return;

    // 1) Active session conflict: only allow resuming
    if (active?.id && active.routineDayId !== routineDayId) {
      setActiveConflictOpen(true);
      return;
    }

    // 2) Date mismatch confirmation
    const day = routine.days.find((d) => d.id === routineDayId);
    if (day && day.dayOfWeek !== todayDow) {
      setPendingDayId(routineDayId);
      setDateConfirmOpen(true);
      return;
    }

    // 3) Start immediately
    void proceedStart(routineDayId);
  };

  const formatSet = (set: RoutineSet): string => {
    if (set.repType === 'FIXED') {
      const reps = set.reps ?? 0;
      const weight = set.weight != null ? ` @ ${set.weight}` : '';
      return `${reps} reps${weight}`;
    }
    const min = set.minReps ?? 0;
    const max = set.maxReps ?? min;
    const weight = set.weight != null ? ` @ ${set.weight}` : '';
    return `${min}-${max} reps${weight}`;
  };

  if (!isLoading && error) {
    return <p className="text-destructive">Error: {error.message}</p>;
  }

  if (!isLoading && !routine) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Routine not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/routines" className="underline-offset-2 hover:underline">
          Routines
        </Link>
        <span>/</span>
        {isLoading ? (
          <Skeleton className="inline-block h-4 w-32 align-middle" />
        ) : (
          <span>{routine?.name ?? ''}</span>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {isLoading ? <Skeleton className="h-6 w-40" /> : routine?.name ?? ''}
            </span>
            {isLoading ? (
              <Skeleton className="h-5 w-28" />
            ) : (
              <div className="flex items-center gap-2">
                {isProgramEnded(routine?.programEndDate) && (
                  <Badge variant="outline">Program ended</Badge>
                )}
                {!isProgramEnded(routine?.programEndDate) && routine?.programEndDate && (
                  <Badge variant="outline">{weeksRemainingFromEndDate(routine.programEndDate)} weeks left</Badge>
                )}
                <Badge variant="outline" className="flex items-center gap-1">
                  <Dumbbell className="h-3 w-3" />
                  <span>{routine?.days?.length ?? 0} days/week</span>
                </Badge>
              </div>
            )}
          </CardTitle>
          {isLoading ? (
            <Skeleton className="h-4 w-3/5" />
          ) : routine?.description ? (
            <CardDescription>{routine.description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            {isLoading ? (
              <Skeleton className="h-10 w-36" />
            ) : (
              <Button
                type="button"
                aria-label="Quick start session"
                onClick={() => handleStart(quickStartDayId)}
                disabled={!quickStartDayId || isStarting || isProgramEnded(routine?.programEndDate)}
              >
                {isStarting && startActingDayId === quickStartDayId ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Dumbbell className="mr-2 h-4 w-4" />
                )}
                Start
              </Button>
            )}
          </div>

          {/* Routine structure - collapsible days */}
          <div className="mt-2">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Accordion
                type="multiple"
                defaultValue={todayDayId ? [todayDayId] : []}
              >
                {routine?.days?.map((day: RoutineDay) => (
                  <AccordionItem key={day.id} value={day.id}>
                    <AccordionTrigger>
                      <div className="flex w-full items-center gap-2">
                        <Badge variant="outline">{weekdayName(day.dayOfWeek)}</Badge>
                        <span className="text-sm text-muted-foreground">
                          Day {day.order}
                        </span>
                        {day.dayOfWeek === todayDow && (
                          <Badge variant="secondary" className="ml-1">
                            Today
                          </Badge>
                        )}
                        <span className="ml-auto text-xs text-muted-foreground">
                          {day.exercises.length} exercises
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="mb-2 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          aria-label={`Start session for ${dayName(day.dayOfWeek)}`}
                          onClick={() => handleStart(day.id)}
                          disabled={(isStarting && startActingDayId === day.id) || isProgramEnded(routine?.programEndDate)}
                          className="w-full sm:w-auto"
                        >
                          {isStarting && startActingDayId === day.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Dumbbell className="mr-2 h-4 w-4" />
                          )}
                          Start this day
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {day.exercises.map((ex) => (
                          <div key={ex.id} className="rounded-md border p-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{ex.exercise.name}</span>
                              <span className="text-xs text-muted-foreground">
                                Rest {ex.restSeconds}s
                              </span>
                            </div>
                            <ul className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
                              {ex.sets.map((s) => (
                                <li
                                  key={`${ex.id}:${s.setNumber}`}
                                  className="text-sm text-muted-foreground"
                                >
                                  <span className="mr-2 inline-block rounded bg-background px-2 py-0.5 text-xs font-medium">
                                    Set {s.setNumber}
                                  </span>
                                  {formatSet(s)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
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
              onClick={() =>
                active?.id && router.push(`/workouts/sessions/${active.id}`)
              }
            >
              Go to Active Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Date mismatch confirmation */}
      <AlertDialog open={dateConfirmOpen} onOpenChange={setDateConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a different day?</AlertDialogTitle>
            <AlertDialogDescription>
              Today is {weekdayName(todayDow, 'long')}. You are about to start{' '}
              {weekdayName(
                routine?.days?.find((d) => d.id === pendingDayId)?.dayOfWeek ??
                  todayDow,
                'long'
              )}
              . Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const toStart = pendingDayId;
                setDateConfirmOpen(false);
                setPendingDayId(null);
                void proceedStart(toStart ?? undefined);
              }}
            >
              Start Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
