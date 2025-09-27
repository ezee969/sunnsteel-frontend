'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  useFinishSession,
  useSession,
  useUpsertSetLog,
} from '@/lib/api/hooks/useWorkoutSession';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  MoveLeft,
  Square,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect, useCallback } from 'react';
import { useRoutine } from '@/lib/api/hooks/useRoutines';
import type { Routine } from '@/lib/api/types/routine.type';
import type { SetLog } from '@/lib/api/types/workout.type';
import { useDebounce } from '@/hooks/use-debounce';
import { RoutineProgress } from '@/features/routines/components/RoutineProgress';
import { Skeleton } from '@/components/ui/skeleton';
import { useSaveState, setSaveState } from '@/lib/utils/save-status-store';
import { markSetPending } from '@/lib/api/hooks/useWorkoutSession';
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
import { ClassicalIcon } from '@/components/icons/ClassicalIcon';
import HeroSection from '@/components/layout/HeroSection';

const formatTime = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ActiveSessionPage() {
  const params = useParams<{ id: string | string[] }>();
  const router = useRouter();
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;

  const { data: session, isLoading, error } = useSession(idParam);
  const { mutate: finishSession, isPending: finishing } = useFinishSession(idParam);
  const { mutate: upsertSetLog } = useUpsertSetLog(idParam);
  const { data: routine } = useRoutine(session?.routineId ?? '');

  const [isConfirmingFinish, setIsConfirmingFinish] = useState(false);
  const [finishStatus, setFinishStatus] = useState<'COMPLETED' | 'ABORTED' | null>(
    null
  );

  const handleSaveSetLog = useCallback(
    (payload: UpsertSetLogPayload) => {
      upsertSetLog(payload);
    },
    [upsertSetLog]
  );

  // No delete of set logs in-session to keep structure fixed to routine template

  const handleBack = () => router.back();

  const handleFinishAttempt = (status: 'COMPLETED' | 'ABORTED') => {
    if (status === 'ABORTED') {
      setFinishStatus('ABORTED');
      setIsConfirmingFinish(true);
      return;
    }

    const day = routine?.days.find((d) => d.id === session?.routineDayId);
    if (!day) {
      setFinishStatus(status);
      setIsConfirmingFinish(true);
      return;
    }

    const completedSetLogs = new Set(
      (session?.setLogs as SetLog[] | undefined)
        ?.filter((l) => l.isCompleted)
        .map((l) => `${l.routineExerciseId}-${l.setNumber}`)
    );

    const allSetsCompleted = day.exercises.every((re) =>
      re.sets.every((set) => completedSetLogs.has(`${re.id}-${set.setNumber}`))
    );

    if (allSetsCompleted) {
      executeFinish(status);
    } else {
      setFinishStatus(status);
      setIsConfirmingFinish(true);
    }
  };

  const executeFinish = (status: 'COMPLETED' | 'ABORTED') => {
    if (!status) return;
    finishSession(
      { status },
      {
        onSuccess: () => {
          router.push('/dashboard');
        },
      }
    );
  };

  const cancelFinish = () => {
    setIsConfirmingFinish(false);
    setFinishStatus(null);
  };

  if (isLoading) {
    return (
      <div className="p-3 sm:p-4 max-w-2xl mx-auto">
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-5 w-52" />
            <div className="space-y-2">
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-2 w-3/4" />
            </div>
            <div className="grid gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
        <div className="mt-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-48" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-4">
        <Button variant="ghost" size="sm" onClick={handleBack} aria-label="Go back">
          <MoveLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <p className="mt-4 text-destructive">Failed to load session.</p>
      </div>
    );
  }

  // Compute overall progress when routine metadata is available
  const dayMeta = routine?.days.find((d) => d.id === session.routineDayId);
  const totalSets = dayMeta
    ? dayMeta.exercises.reduce((acc, re) => acc + re.sets.length, 0)
    : 0;
  const completedKeys = new Set(
    (session.setLogs as SetLog[] | undefined)
      ?.filter((l) => l.isCompleted)
      .map((l) => `${l.routineExerciseId}-${l.setNumber}`)
  );
  const completedSets = dayMeta
    ? dayMeta.exercises.reduce(
        (acc, re) =>
          acc +
          re.sets.filter((s) => completedKeys.has(`${re.id}-${s.setNumber}`)).length,
        0
      )
    : 0;
  const progressPct =
    totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  return (
    <div className="p-3 sm:p-4 max-w-2xl mx-auto">
      {/* Classical Hero (shallow) */}
      <HeroSection
        imageSrc="/backgrounds/vertical-hero-greek-columns.webp"
        sectionClassName="mb-3 sm:mb-4"
        title={<>Training Focus</>}
        subtitle={<>Steady pace. Solid reps.</>}
      />
      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={handleBack} aria-label="Go back">
          <MoveLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{session.status.replace('_', ' ')}</Badge>
          <Badge variant="outline">Started {formatTime(session.startedAt)}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClassicalIcon name="dumbbell" className="h-5 w-5" aria-hidden /> Active
            Session
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Routine:{' '}
            <span className="font-medium">{routine?.name ?? session.routineId}</span>
          </div>
          {totalSets > 0 ? (
            <RoutineProgress
              label="Progress"
              value={progressPct}
              rightText={`${completedSets}/${totalSets} sets (${progressPct}%)`}
            />
          ) : null}
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => handleFinishAttempt('COMPLETED')}
              disabled={finishing}
              aria-label="Finish session"
              variant="classical"
            >
              {finishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Square className="mr-2 h-4 w-4" />
              )}
              Finish
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => handleFinishAttempt('ABORTED')}
              disabled={finishing}
              aria-label="Abort session"
            >
              Abort
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmingFinish} onOpenChange={setIsConfirmingFinish}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {finishStatus === 'COMPLETED'
                ? 'You have incomplete sets. Are you sure you want to finish the session?'
                : 'Are you sure you want to abort this session? All progress will be saved, but the session will be marked as aborted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelFinish}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => executeFinish(finishStatus!)}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Set Logs List (grouped by exercise when routine is available) */}
      <div className="mt-4 space-y-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Set Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!routine ? (
              // Fallback simple list while routine metadata loads
              <div className="space-y-3">
                {session.setLogs?.map((log) => (
                  <LogRow
                    key={`${log.routineExerciseId}-${log.setNumber}`}
                    sessionId={session.id}
                    routineExerciseId={log.routineExerciseId}
                    exerciseId={log.exerciseId}
                    setNumber={log.setNumber}
                    reps={log.reps}
                    weight={log.weight}
                    rpe={log.rpe}
                    isCompleted={log.isCompleted}
                    onSave={handleSaveSetLog}
                  />
                ))}
                {!session.setLogs || session.setLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No set logs yet.</p>
                ) : null}
              </div>
            ) : (
              // Group by exercise using routine + routineDay metadata
              <GroupedLogs
                logs={session.setLogs ?? []}
                routineId={session.routineId}
                routineDayId={session.routineDayId}
                routine={routine}
                sessionId={session.id}
                onSave={handleSaveSetLog}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type UpsertSetLogPayload = {
  routineExerciseId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight?: number;
  isCompleted?: boolean;
};

type LogRowProps = {
  sessionId: string;
  routineExerciseId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight?: number;
  rpe?: number;
  isCompleted: boolean;
  plannedReps?: number | null;
  plannedMinReps?: number | null;
  plannedMaxReps?: number | null;
  plannedWeight?: number | null;
  onSave: (payload: UpsertSetLogPayload) => void;
};

type GroupedLogsProps = {
  logs: Array<{
    id: string;
    routineExerciseId: string;
    exerciseId: string;
    setNumber: number;
    reps: number;
    weight?: number;
    rpe?: number;
    isCompleted: boolean;
  }>;
  routineId: string;
  routineDayId: string;
  routine: Routine;
  sessionId: string;
  onSave: LogRowProps['onSave'];
};

const GroupedLogs = ({
  logs,
  routine,
  routineDayId,
  sessionId,
  onSave,
}: GroupedLogsProps) => {
  const [collapsedExercises, setCollapsedExercises] = useState<Set<string>>(
    new Set()
  );

  const toggleExercise = (exerciseId: string) => {
    setCollapsedExercises((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  };

  const day = routine.days.find((d) => d.id === routineDayId);
  if (!day) {
    return (
      <div className="space-y-3">
        {logs.map((log) => (
          <LogRow
            key={`${log.routineExerciseId}-${log.setNumber}`}
            sessionId={sessionId}
            routineExerciseId={log.routineExerciseId}
            exerciseId={log.exerciseId}
            setNumber={log.setNumber}
            reps={log.reps}
            weight={log.weight}
            isCompleted={log.isCompleted}
            onSave={onSave}
          />
        ))}
      </div>
    );
  }

  // Render according to routine template: exercises in order, sets as defined in routine
  const exercises = [...day.exercises].sort((a, b) => a.order - b.order);
  return (
    <div className="space-y-4">
      {exercises.map((re) => {
        const title = re.exercise.name;
        const isCollapsed = collapsedExercises.has(re.id);
        // For each template set number, find a current log if exists
        const templateSets = [...re.sets].sort((a, b) => a.setNumber - b.setNumber);
        const completedSets = templateSets.filter((tpl) => {
          const log = logs.find(
            (l) => l.routineExerciseId === re.id && l.setNumber === tpl.setNumber
          );
          return log?.isCompleted;
        }).length;

        const isExerciseCompleted =
          templateSets.length > 0 && completedSets === templateSets.length;

        return (
          <Card key={re.id} className="overflow-hidden">
            <CardHeader
              className="pb-3 cursor-pointer select-none hover:bg-muted/50 transition-colors"
              onClick={() => toggleExercise(re.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  {isExerciseCompleted && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  <CardTitle className="text-base font-semibold">{title}</CardTitle>
                </div>
                <Badge
                  variant={isExerciseCompleted ? 'default' : 'outline'}
                  className={`text-xs ${
                    isExerciseCompleted
                      ? 'border-green-600 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : ''
                  }`}
                >
                  {completedSets}/{templateSets.length} sets
                </Badge>
              </div>
            </CardHeader>
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isCollapsed ? 'max-h-0' : 'max-h-[2000px]'
              }`}
            >
              <CardContent className="pt-0 space-y-3">
                {templateSets.map((tpl) => {
                  const log = logs.find(
                    (l) =>
                      l.routineExerciseId === re.id && l.setNumber === tpl.setNumber
                  );
                  return (
                    <LogRow
                      key={`${re.id}-${tpl.setNumber}`}
                      sessionId={sessionId}
                      routineExerciseId={re.id}
                      exerciseId={re.exercise.id}
                      setNumber={tpl.setNumber}
                      reps={log?.reps ?? 0}
                      weight={log?.weight ?? tpl.weight}
                      isCompleted={log?.isCompleted ?? false}
                      plannedReps={tpl.reps}
                      plannedMinReps={tpl.minReps}
                      plannedMaxReps={tpl.maxReps}
                      plannedWeight={tpl.weight}
                      onSave={onSave}
                    />
                  );
                })}
              </CardContent>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

const LogRow = ({
  sessionId,
  routineExerciseId,
  exerciseId,
  setNumber,
  reps,
  weight,
  isCompleted,
  plannedReps,
  plannedMinReps,
  plannedMaxReps,
  plannedWeight,
  onSave,
}: LogRowProps) => {
  const [repsState, setReps] = useState<string>(reps > 0 ? String(reps) : '');
  const [weightState, setWeight] = useState<string>(
    weight !== undefined && weight !== null ? String(weight) : ''
  );
  const [isCompletedState, setIsCompleted] = useState<boolean>(isCompleted);
  const debouncedReps = useDebounce(repsState, 800);
  const debouncedWeight = useDebounce(weightState, 800);
  const saveState = useSaveState(
    `set:${sessionId}:${routineExerciseId}:${setNumber}`
  );

  useEffect(() => {
    const currentReps = Number(debouncedReps);
    const currentWeight =
      debouncedWeight === '' ? undefined : Number(debouncedWeight);

    const hasChanged = currentReps !== reps || currentWeight !== weight;
    
    if (!hasChanged) {
      // Cancel pending state if values reverted to original
      if (saveState === 'pending') {
        setSaveState(`set:${sessionId}:${routineExerciseId}:${setNumber}`, 'idle');
      }
      return;
    }

    onSave({
      routineExerciseId,
      exerciseId,
      setNumber,
      reps: Number(debouncedReps),
      weight: debouncedWeight === '' ? undefined : Number(debouncedWeight),
      isCompleted: isCompletedState,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedReps, debouncedWeight, onSave]);

  // Check immediate values (before debounce) to provide instant feedback
  useEffect(() => {
    const currentReps = Number(repsState);
    const currentWeight = weightState === '' ? undefined : Number(weightState);
    const hasImmediateChange = currentReps !== reps || currentWeight !== weight;
    
    if (hasImmediateChange && saveState === 'idle') {
      // Only mark as pending if we're not already in a save flow
      markSetPending(sessionId, routineExerciseId, setNumber);
    } else if (!hasImmediateChange && saveState === 'pending') {
      // Cancel pending immediately if reverted before debounce
      setSaveState(`set:${sessionId}:${routineExerciseId}:${setNumber}`, 'idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repsState, weightState, reps, weight, saveState]);

  const handleCompletionToggle = (checked: boolean) => {
    setIsCompleted(checked);
    markSetPending(sessionId, routineExerciseId, setNumber);
    onSave({
      routineExerciseId,
      exerciseId,
      setNumber,
      reps: Number(repsState),
      weight: weightState === '' ? undefined : Number(weightState),
      isCompleted: checked,
    });
  };

  const plannedRepsText =
    plannedMinReps && plannedMaxReps
      ? `${plannedMinReps}-${plannedMaxReps}`
      : plannedReps ?? '—';

  return (
    <div
      className={`rounded-lg border-2 p-4 transition-all duration-200 ${
        isCompletedState
          ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
          : 'border-border bg-card'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge
            variant={isCompletedState ? 'default' : 'outline'}
            className="text-xs"
          >
            Set {setNumber}
          </Badge>
          {isCompletedState && (
            <Badge
              variant="secondary"
              className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            >
              ✓ Complete
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {saveState === 'saving' && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
          {saveState === 'error' && (
            <span className="text-xs text-red-600">Error</span>
          )}
          {saveState === 'saved' && (
            <span className="text-xs text-green-600">Saved</span>
          )}
          {saveState === 'pending' && (
            <span className="text-xs text-amber-600">Unsaved</span>
          )}
        </div>
        <Checkbox
          checked={isCompletedState}
          onCheckedChange={(checked: boolean | 'indeterminate') =>
            handleCompletionToggle(Boolean(checked))
          }
          aria-label="Mark set as complete"
          disabled={saveState === 'saving'}
          className="h-5 w-5"
        />
      </div>

      <div className="space-y-4">
        {/* Reps Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">Reps</label>
            <span className="text-xs text-muted-foreground">
              Target: {plannedRepsText}
            </span>
          </div>
          <Input
            type="number"
            inputMode="numeric"
            aria-label="Performed reps"
            placeholder="Enter reps"
            value={repsState}
            onChange={(e) => {
              setReps(e.target.value);
            }}
            disabled={saveState === 'saving'}
            className="text-center text-lg font-semibold h-12"
          />
        </div>

        {/* Weight Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">
              Weight (kg)
            </label>
            <span className="text-xs text-muted-foreground">
              Target: {plannedWeight ? `${plannedWeight} kg` : '—'}
            </span>
          </div>
          <Input
            type="number"
            inputMode="numeric"
            step="0.5"
            aria-label="Performed weight"
            placeholder="Enter weight"
            value={weightState}
            onChange={(e) => {
              setWeight(e.target.value);
            }}
            disabled={saveState === 'saving'}
            className="text-center text-lg font-semibold h-12"
          />
        </div>
      </div>
      {saveState !== 'idle' && (
        <div className="flex items-center justify-center mt-3 text-xs">
          {saveState === 'pending' && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <span className="inline-block w-1.5 h-1.5 bg-current rounded-full"></span>
              Unsaved
            </span>
          )}
          {saveState === 'saving' && (
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <span className="inline-block w-1.5 h-1.5 bg-current rounded-full animate-pulse"></span>
              Saving…
            </span>
          )}
          {saveState === 'saved' && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <span className="inline-block w-1.5 h-1.5 bg-current rounded-full"></span>
              Saved
            </span>
          )}
          {saveState === 'error' && (
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <span className="inline-block w-1.5 h-1.5 bg-current rounded-full"></span>
              Error
            </span>
          )}
        </div>
      )}
    </div>
  );
};
