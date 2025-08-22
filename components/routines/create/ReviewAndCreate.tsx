'use client';

import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Loader2, Save } from 'lucide-react';
import { useCreateRoutine, useUpdateRoutine } from '@/lib/api/hooks/useRoutines';
import { useExercises } from '@/lib/api/hooks/useExercises';
import { formatTime } from '@/lib/utils/time';
import { CreateRoutineRequest } from '@/lib/api/types/routine.type';
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

interface ReviewAndCreateProps {
  data: RoutineData;
  routineId?: string;
  isEditing?: boolean;
  onComplete: () => void;
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

export function ReviewAndCreate({ data, routineId, isEditing = false, onComplete }: ReviewAndCreateProps) {
  const { data: exercises } = useExercises();
  const createRoutineMutation = useCreateRoutine();
  const updateRoutineMutation = useUpdateRoutine();
  const isLoading = isEditing ? updateRoutineMutation.isPending : createRoutineMutation.isPending;

  const prepareRoutineData = (): CreateRoutineRequest => ({
    name: data.name,
    description: data.description,
    isPeriodized: false,
    days: data.days.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      exercises: day.exercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        restSeconds: exercise.restSeconds,
        sets: exercise.sets.map((set) => ({
          setNumber: set.setNumber,
          reps: set.reps,
          weight: set.weight,
        })),
      })),
    })),
  });

  const handleSubmit = async () => {
    try {
      const routineData = prepareRoutineData();
      
      if (isEditing && routineId) {
        await updateRoutineMutation.mutateAsync({ id: routineId, data: routineData });
      } else {
        await createRoutineMutation.mutateAsync(routineData);
      }
      
      onComplete();
    } catch (error) {
      console.error(`Failed to ${isEditing ? 'update' : 'create'} routine:`, error);
      // TODO: Show error message
    }
  };

  const totalExercises = data.days.reduce(
    (sum, day) => sum + day.exercises.length,
    0
  );
  const totalSets = data.days.reduce(
    (sum, day) =>
      sum +
      day.exercises.reduce((exerciseSum, ex) => exerciseSum + ex.sets.length, 0),
    0
  );

  return (
    <div className="space-y-6">
      <Accordion type="single" collapsible defaultValue='item-1' className="w-full">
        {/* Basic Info */}
        <AccordionItem value="item-1">
          <AccordionTrigger>
            <span className="flex items-center gap-2 text-base">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Basic Information
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pl-1">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-base">{data.name}</p>
            </div>
            {data.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm text-muted-foreground">{data.description}</p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Training Schedule */}
        <AccordionItem value="item-2">
          <AccordionTrigger>
            <span className="flex items-center gap-2 text-base">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Training Schedule
            </span>
          </AccordionTrigger>
          <AccordionContent className="pl-1">
            <div className="flex flex-wrap gap-2 mb-2">
              {data.trainingDays.map((dayId) => (
                <Badge key={dayId} variant="secondary">
                  {DAYS_OF_WEEK[dayId]}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {data.trainingDays.length} training days per week
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Workout Details */}
        <AccordionItem value="item-3">
          <AccordionTrigger>
            <span className="flex items-center gap-2 text-base">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Workout Details
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pl-1">
            {data.days.map((day) => {
              const dayName = DAYS_OF_WEEK[day.dayOfWeek];
              return (
                <div key={day.dayOfWeek}>
                  <h4 className="font-medium mb-2 flex items-center justify-between">
                    {dayName}
                    <Badge variant="outline">{day.exercises.length} exercises</Badge>
                  </h4>
                  <div className="space-y-3">
                    {day.exercises.map((exercise, exerciseIndex) => {
                      const exerciseData = exercises?.find(
                        (e: Exercise) => e.id === exercise.exerciseId
                      );
                      return (
                        <div key={exerciseIndex} className="border rounded-md p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h5 className="font-medium">{exerciseData?.name}</h5>
                              <p className="text-xs text-muted-foreground">
                                {exerciseData?.primaryMuscle} • {exerciseData?.equipment}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-0.5">
                              <Clock className="h-3 w-3" />
                              {formatTime(exercise.restSeconds)} rest
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {exercise.sets.map((set) => (
                              <Badge key={set.setNumber} variant="outline" className="text-xs font-normal">
                                {set.reps} reps
                                {set.weight && ` @ ${set.weight}kg`}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Summary Stats */}
      <div className="rounded-lg border bg-card text-card-foreground p-4">
        <h3 className="text-base font-semibold leading-none tracking-tight mb-3 text-center">Routine Summary</h3>
        <div className="flex justify-around text-center">
          <div>
            <p className="text-xl font-bold text-primary">{data.trainingDays.length}</p>
            <p className="text-xs text-muted-foreground">Days</p>
          </div>
          <div>
            <p className="text-xl font-bold text-primary">{totalExercises}</p>
            <p className="text-xs text-muted-foreground">Exercises</p>
          </div>
          <div>
            <p className="text-xl font-bold text-primary">{totalSets}</p>
            <p className="text-xs text-muted-foreground">Sets</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              {isEditing ? (
                <Save className="mr-2 h-4 w-4" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              {isEditing ? 'Update Routine' : 'Create Routine'}
            </>
          )}
        </Button>
      </div>

      {/* Final Note */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">What happens next?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Your routine will be saved and available in your routines list</li>
          <li>• You can start workouts from this routine anytime</li>
          <li>• You can edit or duplicate this routine later</li>
          <li>• Track your progress as you complete workouts</li>
        </ul>
      </div>
    </div>
  );
}

