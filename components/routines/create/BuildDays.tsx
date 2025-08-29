'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Loader2, ChevronsUpDown } from 'lucide-react';
import { useExercises } from '@/lib/api/hooks/useExercises';
import { parseTime } from '@/lib/utils/time';
import { Exercise } from '@/lib/api/types/exercise.type';
import { RoutineWizardData, ProgressionScheme } from './types';
import { Input } from '@/components/ui/input';
import { ExerciseCard } from './ExerciseCard';

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
  const [selectedDay, setSelectedDay] = useState(0);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const [removingSets, setRemovingSets] = useState<Record<string, boolean>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: exercises, isLoading: exercisesLoading } = useExercises();

  const currentDay = data.days.find(
    (d) => d.dayOfWeek === data.trainingDays[selectedDay]
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setExercisePickerOpen(false);
      }
    }

    if (exercisePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [exercisePickerOpen]);

  // Filter exercises based on search and already added exercises
  const filteredExercises =
    exercises?.filter((exercise: Exercise) => {
      const searchLower = searchValue.toLowerCase();
      const matchesSearch =
        exercise.name.toLowerCase().includes(searchLower) ||
        exercise.primaryMuscle.toLowerCase().includes(searchLower) ||
        exercise.equipment.toLowerCase().includes(searchLower);

      // Check if exercise is already added to current day
      const currentDayData = data.days.find(
        (d) => d.dayOfWeek === data.trainingDays[selectedDay]
      );
      const isAlreadyAdded = currentDayData?.exercises.some(
        (ex) => ex.exerciseId === exercise.id
      );

      return matchesSearch && !isAlreadyAdded;
    }) || [];

  const addExercise = (exerciseId: string) => {
    const newDays = [...data.days];
    const dayIndex = newDays.findIndex(
      (d) => d.dayOfWeek === data.trainingDays[selectedDay]
    );

    if (dayIndex === -1) return;

    const newExercise: RoutineWizardData['days'][number]['exercises'][number] = {
      exerciseId,
      progressionScheme: 'NONE' as ProgressionScheme,
      minWeightIncrement: 2.5, // Default weight increment
      sets: [{ setNumber: 1, repType: 'FIXED', reps: 10, weight: undefined }],
      restSeconds: 120, // 2 minutes default
    };

    newDays[dayIndex].exercises.push(newExercise);
    onUpdate({ days: newDays });
    setExercisePickerOpen(false);
    setSearchValue('');
  };

  const removeExercise = (exerciseIndex: number) => {
    const newDays = [...data.days];
    const dayIndex = newDays.findIndex(
      (d) => d.dayOfWeek === data.trainingDays[selectedDay]
    );

    if (dayIndex === -1) return;

    newDays[dayIndex].exercises.splice(exerciseIndex, 1);
    onUpdate({ days: newDays });
  };

  // Helpers: clamp and steppers for inputs (reps/min/max/weight)
  const clamp = (value: number, min: number, max: number) => {
    if (Number.isNaN(value)) return min;
    return Math.min(max, Math.max(min, value));
  };

  const stepFixedReps = (
    exerciseIndex: number,
    setIndex: number,
    delta: number
  ) => {
    const newDays = [...data.days];
    const dayIndex = newDays.findIndex(
      (d) => d.dayOfWeek === data.trainingDays[selectedDay]
    );
    if (dayIndex === -1) return;
    const set = newDays[dayIndex].exercises[exerciseIndex].sets[setIndex];
    const current = set.reps ?? 1;
    const next = clamp(current + delta, 1, 50);
    set.reps = next;
    onUpdate({ days: newDays });
  };

  const stepRangeReps = (
    exerciseIndex: number,
    setIndex: number,
    field: 'minReps' | 'maxReps',
    delta: number
  ) => {
    const newDays = [...data.days];
    const dayIndex = newDays.findIndex(
      (d) => d.dayOfWeek === data.trainingDays[selectedDay]
    );
    if (dayIndex === -1) return;
    const set = newDays[dayIndex].exercises[exerciseIndex].sets[setIndex];
    if (field === 'minReps') {
      const currentMin = set.minReps ?? 1;
      const nextMin = clamp(currentMin + delta, 1, 50);
      set.minReps = nextMin;
      if (
        set.maxReps !== null &&
        set.maxReps !== undefined &&
        (set.maxReps as number) < nextMin
      ) {
        set.maxReps = nextMin;
      }
    } else {
      const curMaxBase = set.maxReps ?? (set.minReps ?? 1);
      const nextMax = clamp(curMaxBase + delta, 1, 50);
      set.maxReps = nextMax;
      if (
        set.minReps !== null &&
        set.minReps !== undefined &&
        (set.minReps as number) > nextMax
      ) {
        set.minReps = nextMax;
      }
    }
    onUpdate({ days: newDays });
  };

  const stepWeight = (
    exerciseIndex: number,
    setIndex: number,
    delta: number
  ) => {
    const newDays = [...data.days];
    const dayIndex = newDays.findIndex(
      (d) => d.dayOfWeek === data.trainingDays[selectedDay]
    );
    if (dayIndex === -1) return;
    const set = newDays[dayIndex].exercises[exerciseIndex].sets[setIndex];
    const current = set.weight ?? 0;
    const next = Math.max(0, Math.round((current + delta * 0.5) * 2) / 2);
    set.weight = next;
    onUpdate({ days: newDays });
  };

  const updateProgressionScheme = (exerciseIndex: number, scheme: ProgressionScheme) => {
    const newDays = [...data.days];
    const dayIndex = newDays.findIndex(
      (d) => d.dayOfWeek === data.trainingDays[selectedDay]
    );
    if (dayIndex === -1) return;
    newDays[dayIndex].exercises[exerciseIndex].progressionScheme = scheme;
    onUpdate({ days: newDays });
  };

  const updateMinWeightIncrement = (exerciseIndex: number, increment: number) => {
    const newDays = [...data.days];
    const dayIndex = newDays.findIndex(
      (d) => d.dayOfWeek === data.trainingDays[selectedDay]
    );
    if (dayIndex === -1) return;
    newDays[dayIndex].exercises[exerciseIndex].minWeightIncrement = Math.max(0.25, increment);
    onUpdate({ days: newDays });
  };

  const addSet = (exerciseIndex: number) => {
    const newDays = [...data.days];
    const dayIndex = newDays.findIndex(
      (d) => d.dayOfWeek === data.trainingDays[selectedDay]
    );

    if (dayIndex === -1) return;

    const exercise = newDays[dayIndex].exercises[exerciseIndex];
    const newSetNumber = exercise.sets.length + 1;

    const lastSet = exercise.sets[exercise.sets.length - 1];
    exercise.sets.push({
      setNumber: newSetNumber,
      repType: lastSet?.repType ?? 'FIXED',
      reps: lastSet?.repType === 'FIXED' ? (lastSet?.reps ?? 10) : null,
      minReps: lastSet?.repType === 'RANGE' ? (lastSet?.minReps ?? 8) : null,
      maxReps: lastSet?.repType === 'RANGE' ? (lastSet?.maxReps ?? 12) : null,
      weight: lastSet?.weight,
    });

    onUpdate({ days: newDays });
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const newDays = [...data.days];
    const dayIndex = newDays.findIndex(
      (d) => d.dayOfWeek === data.trainingDays[selectedDay]
    );

    if (dayIndex === -1) return;

    newDays[dayIndex].exercises[exerciseIndex].sets.splice(setIndex, 1);

    // Renumber sets
    newDays[dayIndex].exercises[exerciseIndex].sets.forEach((set, index) => {
      set.setNumber = index + 1;
    });

    onUpdate({ days: newDays });
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: 'repType' | 'reps' | 'minReps' | 'maxReps' | 'weight',
    value: string
  ) => {
    const newDays = [...data.days];
    const dayIndex = newDays.findIndex(
      (d) => d.dayOfWeek === data.trainingDays[selectedDay]
    );

    if (dayIndex === -1) return;

    const targetSet = newDays[dayIndex].exercises[exerciseIndex].sets[setIndex];
    if (field === 'repType') {
      const nextType = (value as 'FIXED' | 'RANGE');
      targetSet.repType = nextType;
      if (nextType === 'FIXED') {
        targetSet.reps = targetSet.reps ?? targetSet.minReps ?? 10;
        targetSet.minReps = null;
        targetSet.maxReps = null;
      } else {
        const fallback = targetSet.reps ?? 10;
        targetSet.minReps = targetSet.minReps ?? Math.max(1, Math.min(50, fallback - 2));
        targetSet.maxReps = targetSet.maxReps ?? Math.max(targetSet.minReps ?? 8, fallback + 2);
        targetSet.reps = null;
      }
    } else if (field === 'weight') {
      targetSet.weight = value === '' ? undefined : parseFloat(value);
    } else if (field === 'reps') {
      if (value === '') {
        targetSet.reps = null;
      } else {
        const next = Math.max(1, Math.min(50, parseInt(value)));
        targetSet.reps = Number.isNaN(next) ? null : next;
      }
    } else if (field === 'minReps') {
      if (value === '') {
        targetSet.minReps = null;
      } else {
        const next = Math.max(1, Math.min(50, parseInt(value)));
        targetSet.minReps = Number.isNaN(next) ? null : next;
      }
      if (
        targetSet.maxReps !== null &&
        targetSet.maxReps !== undefined &&
        targetSet.minReps !== null &&
        (targetSet.minReps as number) > (targetSet.maxReps as number)
      ) {
        targetSet.maxReps = targetSet.minReps;
      }
    } else if (field === 'maxReps') {
      if (value === '') {
        targetSet.maxReps = null;
      } else {
        const next = Math.max(1, Math.min(50, parseInt(value)));
        targetSet.maxReps = Number.isNaN(next) ? null : next;
      }
      if (
        targetSet.minReps !== null &&
        targetSet.minReps !== undefined &&
        targetSet.maxReps !== null &&
        (targetSet.maxReps as number) < (targetSet.minReps as number)
      ) {
        targetSet.minReps = targetSet.maxReps;
      }
    }

    onUpdate({ days: newDays });
  };

  const updateRestTime = (exerciseIndex: number, timeStr: string) => {
    const newDays = [...data.days];
    const dayIndex = newDays.findIndex(
      (d) => d.dayOfWeek === data.trainingDays[selectedDay]
    );

    if (dayIndex === -1) return;

    newDays[dayIndex].exercises[exerciseIndex].restSeconds = parseTime(timeStr);
    onUpdate({ days: newDays });
  };

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
          <TabsList className="flex w-full justify-start overflow-x-auto">
            {data.trainingDays.map((dayId, index) => (
              <TabsTrigger
                key={dayId}
                value={index.toString()}
                className="flex-shrink-0"
              >
                {DAYS_OF_WEEK[dayId]}
                {currentDay && currentDay.exercises.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {data.days.find((d) => d.dayOfWeek === dayId)?.exercises
                      .length || 0}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {data.trainingDays.map((dayId, tabIndex) => {
            const day = data.days.find((d) => d.dayOfWeek === dayId);

            return (
              <TabsContent key={dayId} value={tabIndex.toString()} className="mt-6">
                <Card>
                  <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <CardTitle>{DAYS_OF_WEEK[dayId]} Workout</CardTitle>
                    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
                      <Button
                        onClick={() => setExercisePickerOpen(!exercisePickerOpen)}
                        variant="outline"
                        size="sm"
                        className="justify-between w-full sm:min-w-[200px]"
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          <span className="hidden xs:inline">Add Exercise</span>
                          <span className="xs:hidden">Add</span>
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>

                    {exercisePickerOpen && (
                      <div className="absolute top-full left-0 sm:right-0 sm:left-auto z-50 w-full sm:w-[300px] mt-1 bg-popover border rounded-md shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
                        <div className="p-2 border-b">
                          <Input
                            aria-label="Search exercises"
                            placeholder="Search exercises..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                          />
                        </div>
                        <div className="max-h-[240px] overflow-y-auto p-1">
                          {exercisesLoading ? (
                            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading...
                            </div>
                          ) : filteredExercises.length > 0 ? (
                            <div className="space-y-1">
                              {filteredExercises.map((ex) => (
                                <Button
                                  key={ex.id}
                                  variant="ghost"
                                  className="w-full justify-start px-3 py-2"
                                  onClick={() => addExercise(ex.id)}
                                >
                                  <div className="flex flex-col items-start">
                                    <span className="text-sm font-medium">{ex.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {ex.primaryMuscle} • {ex.equipment}
                                    </span>
                                  </div>
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              No exercises found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {day && day.exercises.length > 0 ? (
                    <div className="space-y-4">
                      {day.exercises.map((exercise, exerciseIndex) => {
                        const exerciseData = exercises?.find(
                          (ex: Exercise) => ex.id === exercise.exerciseId
                        );

                        return (
                          <ExerciseCard
                            key={exerciseIndex}
                            tabIndex={tabIndex}
                            exerciseIndex={exerciseIndex}
                            exercise={exercise}
                            exerciseData={exerciseData}
                            expanded={(expandedMap?.[exerciseIndex] ?? true)}
                            onToggleExpand={(idx) =>
                              setExpandedMap((prev) => ({
                                ...prev,
                                [idx]: !(prev?.[idx] ?? true),
                              }))
                            }
                            onRemoveExercise={removeExercise}
                            onUpdateRestTime={updateRestTime}
                            onUpdateProgressionScheme={updateProgressionScheme}
                            onUpdateMinWeightIncrement={updateMinWeightIncrement}
                            onAddSet={addSet}
                            onRemoveSet={removeSet}
                            isRemovingSet={(exIdx, setIdx) => !!removingSets[`${exIdx}-${setIdx}`]}
                            onRemoveSetAnimated={(exIdx, setIdx) => {
                              const key = `${exIdx}-${setIdx}`;
                              setRemovingSets((prev) => ({ ...prev, [key]: true }));
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
                            onStepFixedReps={stepFixedReps}
                            onStepRangeReps={stepRangeReps}
                            onStepWeight={stepWeight}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      No exercises added yet. Use &quot;Add Exercise&quot; to start building your day.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
              );
            })}
          </Tabs>

          {/* Overall Stats */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-center gap-8 text-center">
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
