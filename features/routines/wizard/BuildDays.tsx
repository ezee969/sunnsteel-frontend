'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExercises } from '@/lib/api/hooks';
import { parseTime } from '@/lib/utils/time';
import { RoutineWizardData, ProgressionScheme } from './types';
import { ExerciseList } from './components/ExerciseList';
import { ExercisePickerDropdown } from './components/ExercisePickerDropdown';
import { useRoutineDaySelection } from './hooks/useRoutineDaySelection';
import { useRoutineDayMutations } from './hooks/useRoutineDayMutations';

interface BuildDaysProps {
  data: RoutineWizardData;
  onUpdate: (updates: Partial<RoutineWizardData>) => void;
}

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function BuildDays({ data, onUpdate }: BuildDaysProps) {
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const [removingSets, setRemovingSets] = useState<Record<string, boolean>>({});
  const exerciseRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [pendingScrollKey, setPendingScrollKey] = useState<string | null>(null);
  const { data: exercises, isLoading: exercisesLoading } = useExercises();
  const canUseTimeframe = data.programScheduleMode === 'TIMEFRAME';
  const {
    selectedDay,
    setSelectedDay,
    dropdownRef,
    picker: {
      isOpen: isPickerOpen,
      toggle: togglePicker,
      close: closePicker,
      searchValue,
      setSearchValue,
      filteredExercises,
    },
  } = useRoutineDaySelection({
    exercises,
    trainingDays: data.trainingDays,
  });

  const {
    addExercise,
    removeExercise,
    updateExercise,
    updateProgramTMKg,
    updateProgramRoundingKg,
    updateProgressionScheme,
    updateMinWeightIncrement,
    addSet,
    removeSet,
    stepFixedReps,
    stepRangeReps,
    stepWeight,
    updateSet,
    validateMinMaxReps,
    setRestSeconds,
  } = useRoutineDayMutations({
    data,
    onUpdate,
    selectedDayIndex: selectedDay,
    trainingDays: data.trainingDays,
    canUseTimeframe,
  });

  // Note: we compute day-specific data on-demand below to avoid stale references

  // If schedule is NONE, ensure no time-based progression remains selected
  useEffect(() => {
    if (canUseTimeframe) return;
    const hasAnyTimeBased = data.days.some((day) =>
      day.exercises.some((ex) => ex.progressionScheme === 'PROGRAMMED_RTF')
    )
    if (!hasAnyTimeBased) return;
    const newDays = data.days.map((day) => ({
      ...day,
      exercises: day.exercises.map((ex) => {
        if (ex.progressionScheme === 'PROGRAMMED_RTF') {
          return { ...ex, progressionScheme: 'NONE' as ProgressionScheme };
        }
        return ex;
      }),
    }));
    onUpdate({ days: newDays });
  }, [canUseTimeframe, data.days, onUpdate]);

  // Scroll after render to target exercise card if queued

  // After days update, if we have a pending target, scroll to it (with small retries)
  useEffect(() => {
    if (!pendingScrollKey) return;

    let attempts = 0;
    const maxAttempts = 5;

    const tryScroll = () => {
      const el = exerciseRefs.current[pendingScrollKey!];
      if (el) {
        const rect = el.getBoundingClientRect();
        const absoluteTop = rect.top + window.scrollY;
        const target = absoluteTop - window.innerHeight / 2 + rect.height / 2;
        window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
        setPendingScrollKey(null);
        return;
      }
      attempts += 1;
      if (attempts < maxAttempts) {
        requestAnimationFrame(tryScroll);
      }
    };

    const raf = requestAnimationFrame(tryScroll);
    return () => cancelAnimationFrame(raf);
  }, [pendingScrollKey, data.days]);

  const handleAddExercise = (exerciseId: string) => {
    const index = addExercise(exerciseId);
    if (index === null) return;
    closePicker();
    setPendingScrollKey(`${exerciseId}-${index}`);
  };

  const registerExerciseRef = useCallback((key: string, node: HTMLDivElement | null) => {
    exerciseRefs.current[key] = node;
  }, []);

  if (data.trainingDays.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No training days selected. Go back to select training days first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">
          Build Your Training Days
          <span className="text-destructive ml-1">*</span>
        </h3>

        {/* Day Tabs */}
        <Tabs
          value={selectedDay.toString()}
          onValueChange={(value: string) => setSelectedDay(parseInt(value))}
        >
          <TabsList className="flex w-full justify-start overflow-x-auto overflow-y-hidden whitespace-nowrap pb-1 mb-2">
            {data.trainingDays.map((dayId, index) => (
              <TabsTrigger
                key={dayId}
                value={index.toString()}
                className="flex-shrink-0 whitespace-nowrap h-10 px-4"
              >
                {DAYS_OF_WEEK[dayId]}
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 min-w-[1.25rem] px-1 text-[10px] leading-none flex items-center justify-center"
                >
                  {data.days.find((d) => d.dayOfWeek === dayId)?.exercises?.length ??
                    0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {data.trainingDays.map((dayId, tabIndex) => {
            const day = data.days.find((d) => d.dayOfWeek === dayId);

            return (
              <TabsContent key={dayId} value={tabIndex.toString()} className="mt-4">
                <Card>
                  <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-6">
                    <CardTitle>{DAYS_OF_WEEK[dayId]} Workout</CardTitle>
                    <ExercisePickerDropdown
                      ref={dropdownRef}
                      isOpen={isPickerOpen}
                      onToggle={togglePicker}
                      onClose={closePicker}
                      searchValue={searchValue}
                      onSearchChange={setSearchValue}
                      exercises={filteredExercises}
                      isLoading={!!exercisesLoading}
                      onSelect={handleAddExercise}
                    />
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <ExerciseList
                      tabIndex={tabIndex}
                      day={day}
                      exercisesCatalog={exercises}
                      expandedMap={expandedMap}
                      onToggleExpand={(idx) =>
                        setExpandedMap((prev) => ({
                          ...prev,
                          [idx]: !(prev?.[idx] ?? true),
                        }))
                      }
                      onRemoveExercise={removeExercise}
                      onUpdateExercise={updateExercise}
                      onUpdateRestTime={(exerciseIndex, value) =>
                        setRestSeconds(exerciseIndex, parseTime(value))
                      }
                      onUpdateProgressionScheme={updateProgressionScheme}
                      onUpdateMinWeightIncrement={updateMinWeightIncrement}
                      onUpdateProgramTMKg={updateProgramTMKg}
                      onUpdateProgramRoundingKg={updateProgramRoundingKg}
                      onAddSet={addSet}
                      onRemoveSetAnimated={(exIdx, setIdx) => {
                        const key = `${exIdx}-${setIdx}`;
                        setRemovingSets((prev) => ({
                          ...prev,
                          [key]: true,
                        }));
                        setTimeout(() => {
                          removeSet(exIdx, setIdx);
                          setRemovingSets((prev) => {
                            const next = { ...prev };
                            delete next[key];
                            return next;
                          });
                        }, 180);
                      }}
                      onUpdateSet={updateSet}
                      onValidateMinMaxReps={validateMinMaxReps}
                      onStepFixedReps={stepFixedReps}
                      onStepRangeReps={stepRangeReps}
                      onStepWeight={stepWeight}
                      isRemovingSet={(exIdx, setIdx) =>
                        !!removingSets[`${exIdx}-${setIdx}`]
                      }
                      disableTimeBasedProgressions={!canUseTimeframe}
                      registerRef={registerExerciseRef}
                      exercises={exercises}
                      isExercisesLoading={exercisesLoading}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Overall Stats */}
        <div className="mt-6 pt-5 border-t">
          <div className="flex justify-center gap-6 sm:gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {data.days.reduce((sum, day) => sum + day.exercises.length, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Exercises</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {data.days.reduce(
                  (sum, day) =>
                    sum +
                    day.exercises.reduce(
                      (exerciseSum, ex) => exerciseSum + ex.sets.length,
                      0
                    ),
                  0
                )}
              </div>
              <div className="text-xs text-muted-foreground">Total Sets</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {data.days.filter((day) => day.exercises.length > 0).length}/
                {data.days.length}
              </div>
              <div className="text-xs text-muted-foreground">Days Complete</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
