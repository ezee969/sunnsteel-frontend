'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Dumbbell, Target, Weight } from 'lucide-react';
import { useSession } from '@/lib/api/hooks/useWorkoutSession';
import type { SetLog } from '@/lib/api/types/workout.type';
import { formatTimeReadable } from '@/lib/utils/time';

interface ExerciseGroup {
  exercise: {
    id: string;
    name: string;
    primaryMuscle?: string | null;
    equipment?: string | null;
  };
  plannedSets: {
    id: string;
    setNumber: number;
    repType: 'FIXED' | 'RANGE';
    reps?: number | null;
    minReps?: number | null;
    maxReps?: number | null;
    weight?: number | null;
  }[];
  performedSets: SetLog[];
}

const getDayName = (dayOfWeek: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || '';
};

const formatWeight = (weight?: number | null): string => {
  if (!weight) return '—';
  return `${weight} kg`;
};

const formatReps = (reps?: number | null): string => {
  if (!reps) return '—';
  return `${reps}`;
};

export default function WorkoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: session, isLoading, isError, error } = useSession(id);

  // UI state: collapsed exercises (id -> collapsed?)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Loading workout details...
        </div>
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-sm text-destructive" role="alert">
          {String(error) || 'Failed to load workout details'}
        </div>
      </div>
    );
  }

  // Group set logs by routine exercise
  const setLogsByExercise = (session.setLogs || []).reduce((acc: Record<string, SetLog[]>, log: SetLog) => {
    if (!acc[log.routineExerciseId]) {
      acc[log.routineExerciseId] = [];
    }
    acc[log.routineExerciseId].push(log);
    return acc;
  }, {} as Record<string, SetLog[]>);

  // Create exercise groups from routine day exercises
  const exerciseGroups = new Map<string, ExerciseGroup>();

  const toggleCollapsed = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  if (session.routineDay?.exercises) {
    session.routineDay.exercises.forEach((routineExercise) => {
      exerciseGroups.set(routineExercise.id, {
        exercise: routineExercise.exercise,
        plannedSets: routineExercise.sets,
        performedSets: setLogsByExercise[routineExercise.id] || [],
      });
    });
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{session.routine?.name || 'Workout Session'}</h1>
            <p className="text-muted-foreground">
              {session.routineDay?.dayOfWeek !== undefined ? getDayName(session.routineDay.dayOfWeek) : 'Unknown Day'} • {new Date(session.startedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Session Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={session.status === 'COMPLETED' ? 'default' : session.status === 'IN_PROGRESS' ? 'secondary' : 'destructive'}>
                  {session.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{session.durationSec ? formatTimeReadable(session.durationSec) : '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span>{session.setLogs?.filter((log: SetLog) => log.isCompleted).length || 0} sets</span>
              </div>
              <div className="flex items-center gap-2">
                <Weight className="h-4 w-4 text-muted-foreground" />
                <span>
                  {session.setLogs?.reduce((total: number, log: SetLog) => {
                    if (log.isCompleted && log.weight && log.reps) {
                      return total + (log.weight * log.reps);
                    }
                    return total;
                  }, 0).toFixed(1) || '0'} kg
                </span>
              </div>
            </div>
            {session.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">{session.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {Array.from(exerciseGroups.entries()).map(([routineExerciseId, group]: [string, ExerciseGroup]) => (
          <Card key={routineExerciseId}>
            <CardHeader
              role="button"
              tabIndex={0}
              onClick={() => toggleCollapsed(routineExerciseId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') toggleCollapsed(routineExerciseId);
              }}
              className="pb-3 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{group.exercise.name}</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  {group.exercise.primaryMuscle} • {group.exercise.equipment}
                </Badge>
                {collapsed[routineExerciseId] ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            {!collapsed[routineExerciseId] && (
              <CardContent className="pt-0">
              {/* Desktop Headers */}
              <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground mb-2 px-1">
                <div className="col-span-2">Set</div>
                <div className="col-span-3">Planned</div>
                <div className="col-span-2">Reps</div>
                <div className="col-span-2">Weight</div>
                <div className="col-span-2">RPE</div>
                <div className="col-span-1">✓</div>
              </div>

              {/* Sets */}
              <div className="space-y-2">
                {group.plannedSets.map((plannedSet) => {
                  const performedSet = group.performedSets.find(
                    (ps: SetLog) => ps.setNumber === plannedSet.setNumber
                  );

                  return (
                    <div
                      key={plannedSet.setNumber}
                      className="bg-card border border-muted rounded-lg p-3 sm:p-0 sm:bg-transparent sm:border-0 sm:rounded-none"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-2 items-start sm:items-center">
                        {/* Set Number */}
                        <div className="sm:col-span-2">
                          <div className="flex items-center justify-between sm:justify-start">
                            <Badge variant="outline" className="text-xs px-2 py-1">
                              Set {plannedSet.setNumber}
                            </Badge>
                            <div className="sm:hidden">
                              {performedSet?.isCompleted ? (
                                <Badge variant="default" className="text-xs">✓</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">—</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Planned */}
                        <div className="sm:col-span-3">
                          <div className="space-y-1">
                            <div className="sm:hidden text-xs font-medium text-muted-foreground">Planned</div>
                            <div className="text-sm">
                              {plannedSet.repType === 'FIXED' 
                                ? `${plannedSet.reps} reps`
                                : `${plannedSet.minReps}-${plannedSet.maxReps} reps`
                              }
                              {plannedSet.weight && ` @ ${plannedSet.weight} kg`}
                            </div>
                          </div>
                        </div>

                        {/* Performed Reps */}
                        <div className="sm:col-span-2">
                          <div className="space-y-1">
                            <div className="sm:hidden text-xs font-medium text-muted-foreground">Reps</div>
                            <div className="text-sm font-medium">
                              {formatReps(performedSet?.reps)}
                            </div>
                          </div>
                        </div>

                        {/* Performed Weight */}
                        <div className="sm:col-span-2">
                          <div className="space-y-1">
                            <div className="sm:hidden text-xs font-medium text-muted-foreground">Weight</div>
                            <div className="text-sm font-medium">
                              {formatWeight(performedSet?.weight)}
                            </div>
                          </div>
                        </div>

                        {/* RPE */}
                        <div className="sm:col-span-2">
                          <div className="space-y-1">
                            <div className="sm:hidden text-xs font-medium text-muted-foreground">RPE</div>
                            <div className="text-sm">
                              {performedSet?.rpe ? `${performedSet.rpe}/10` : '—'}
                            </div>
                          </div>
                        </div>

                        {/* Completed Status */}
                        <div className="hidden sm:flex sm:col-span-1 justify-center">
                          {performedSet?.isCompleted ? (
                            <Badge variant="default" className="text-xs">✓</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">—</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
