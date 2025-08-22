'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Clock, Loader2, ChevronsUpDown } from 'lucide-react';
import { useExercises } from '@/lib/api/hooks/useExercises';
import { formatTime, parseTime } from '@/lib/utils/time';
import { Exercise } from '@/lib/api/types/exercise.type';

interface RoutineData {
  name: string;
  description?: string;
  trainingDays: number[];
  days: Array<{
    dayOfWeek: number;
    exercises: Array<{
      exerciseId: string;
      sets: Array<{
        setNumber: number;
        reps: number;
        weight?: number;
      }>;
      restSeconds: number;
    }>;
  }>;
}

interface BuildDaysProps {
  data: RoutineData;
  onUpdate: (updates: Partial<RoutineData>) => void;
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

    const newExercise = {
      exerciseId,
      sets: [{ setNumber: 1, reps: 10, weight: undefined }],
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

  const addSet = (exerciseIndex: number) => {
    const newDays = [...data.days];
    const dayIndex = newDays.findIndex(
      (d) => d.dayOfWeek === data.trainingDays[selectedDay]
    );

    if (dayIndex === -1) return;

    const exercise = newDays[dayIndex].exercises[exerciseIndex];
    const newSetNumber = exercise.sets.length + 1;

    exercise.sets.push({
      setNumber: newSetNumber,
      reps: exercise.sets[exercise.sets.length - 1]?.reps || 10,
      weight: exercise.sets[exercise.sets.length - 1]?.weight,
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
    field: 'reps' | 'weight',
    value: string
  ) => {
    const newDays = [...data.days];
    const dayIndex = newDays.findIndex(
      (d) => d.dayOfWeek === data.trainingDays[selectedDay]
    );

    if (dayIndex === -1) return;

    if (field === 'weight') {
      newDays[dayIndex].exercises[exerciseIndex].sets[setIndex][field] = value
        ? parseFloat(value)
        : undefined;
    } else {
      newDays[dayIndex].exercises[exerciseIndex].sets[setIndex][field] =
        parseInt(value) || 0;
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
                        <div className="absolute top-full left-0 sm:right-0 sm:left-auto z-50 w-full sm:w-[300px] mt-1 bg-popover border rounded-md shadow-lg">
                          <div className="p-2 border-b">
                            <Input
                              placeholder="Search exercises..."
                              value={searchValue}
                              onChange={(e) => setSearchValue(e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <div className="max-h-[200px] overflow-y-auto">
                            {exercisesLoading ? (
                              <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Loading exercises...
                              </div>
                            ) : filteredExercises.length === 0 ? (
                              <div className="py-4 text-center text-sm text-muted-foreground">
                                No exercises found.
                              </div>
                            ) : (
                              <div className="p-1">
                                {filteredExercises.map((exercise: Exercise) => (
                                  <div
                                    key={exercise.id}
                                    onClick={() => addExercise(exercise.id)}
                                    className="flex flex-col items-start p-2 hover:bg-accent rounded-sm cursor-pointer"
                                  >
                                    <div className="font-medium text-sm">
                                      {exercise.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {exercise.primaryMuscle} • {exercise.equipment}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!day || day.exercises.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No exercises added yet</p>
                        <p className="text-sm">
                          Click &quot;Add Exercise&quot; to get started
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {day.exercises.map((exercise, exerciseIndex) => {
                          const exerciseData = exercises?.find(
                            (e: Exercise) => e.id === exercise.exerciseId
                          );

                          return (
                            <Card key={exerciseIndex} className="border-muted">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium">
                                      {exerciseData?.name || 'Unknown Exercise'}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      {exerciseData?.primaryMuscle} •{' '}
                                      {exerciseData?.equipment}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      <Input
                                        placeholder="0:00"
                                        value={formatTime(exercise.restSeconds)}
                                        onChange={(e) =>
                                          updateRestTime(
                                            exerciseIndex,
                                            e.target.value
                                          )
                                        }
                                        className="w-16 text-sm"
                                      />
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeExercise(exerciseIndex)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                                    <div className="col-span-2">Set</div>
                                    <div className="col-span-3">Reps</div>
                                    <div className="col-span-3">Weight</div>
                                    <div className="col-span-4"></div>
                                  </div>

                                  {exercise.sets.map((set, setIndex) => (
                                    <div
                                      key={setIndex}
                                      className="grid grid-cols-12 gap-2 items-center"
                                    >
                                      <div className="col-span-2">
                                        <Badge variant="outline">
                                          {set.setNumber}
                                        </Badge>
                                      </div>
                                      <div className="col-span-3">
                                        <Input
                                          type="number"
                                          min="1"
                                          max="50"
                                          value={set.reps}
                                          onChange={(e) =>
                                            updateSet(
                                              exerciseIndex,
                                              setIndex,
                                              'reps',
                                              e.target.value
                                            )
                                          }
                                          className="text-center"
                                        />
                                      </div>
                                      <div className="col-span-3">
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.5"
                                          placeholder="0"
                                          value={set.weight || ''}
                                          onChange={(e) =>
                                            updateSet(
                                              exerciseIndex,
                                              setIndex,
                                              'weight',
                                              e.target.value
                                            )
                                          }
                                          className="text-center"
                                        />
                                      </div>
                                      <div className="col-span-4 flex justify-end">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            removeSet(exerciseIndex, setIndex)
                                          }
                                          disabled={exercise.sets.length === 1}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addSet(exerciseIndex)}
                                    className="w-full mt-2"
                                    disabled={exercise.sets.length >= 10}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Set
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      {/* Progress Summary */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Routine Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.days.map((day) => {
              const dayName = DAYS_OF_WEEK[day.dayOfWeek];
              const exerciseCount = day.exercises.length;
              const totalSets = day.exercises.reduce(
                (sum, ex) => sum + ex.sets.length,
                0
              );
              const isComplete = exerciseCount > 0;

              return (
                <div
                  key={day.dayOfWeek}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    isComplete
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                      : 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-sm">{dayName}</h5>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isComplete ? 'bg-green-500' : 'bg-orange-500'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Exercises</span>
                      <span className="font-medium">{exerciseCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Total Sets</span>
                      <span className="font-medium">{totalSets}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

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
        </CardContent>
      </Card>
    </div>
  );
}
