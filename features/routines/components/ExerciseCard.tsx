'use client';

import { Badge } from '@/components/ui/badge';
import { useRtFWeekGoals } from '@/lib/api/hooks/useRoutines';
import { getCurrentProgramWeek, isDeloadWeek, getRtfVariant, isRtfProgressionScheme } from '@/lib/utils/rtf-week-calculator';
import { useMemo } from 'react';
import type { RtfExerciseGoal } from '@/lib/api/types';

interface ExerciseCardProps {
  exercise: {
    id: string;
    exercise?: {
      name: string;
    };
    progressionScheme?: string;
    sets?: {
      id?: string;
      setNumber?: number;
      reps?: number | null;
      minReps?: number | null;
      maxReps?: number | null;
      weight?: number;
      rpe?: number;
    }[];
  };
  routineId?: string;
  routine?: {
    programStartDate?: string | null;
    programDurationWeeks?: number | null;
    programTimezone?: string | null;
    programWithDeloads?: boolean | null;
  };
}

/**
 * Card component for displaying exercise details within routine days
 * 
 * Features:
 * - Exercise name and progression scheme display
 * - Set details with reps, weight, and RPE
 * - RtF-specific display with intensity, AMRAP sets, and variant badges
 * - Deload week indicators
 * - Numbered set indicators
 */
export const ExerciseCard = ({ exercise, routineId, routine }: ExerciseCardProps) => {
  // Calculate current week for RtF exercises
  const currentWeek = useMemo(() => {
    if (!routine?.programStartDate || !routine?.programDurationWeeks || !routine?.programTimezone) {
      return undefined;
    }
    
    return getCurrentProgramWeek(
      routine.programStartDate,
      routine.programDurationWeeks,
      routine.programTimezone
    );
  }, [routine?.programStartDate, routine?.programDurationWeeks, routine?.programTimezone]);

  // Fetch RtF week goals if this is an RtF exercise
  const isRtfExercise = exercise.progressionScheme && isRtfProgressionScheme(exercise.progressionScheme);
  const { data: rtfData } = useRtFWeekGoals(
    isRtfExercise && routineId ? routineId : '',
    isRtfExercise && currentWeek ? currentWeek : undefined
  );

  // Find the specific exercise goal for this exercise
  const exerciseGoal = useMemo((): RtfExerciseGoal | undefined => {
    if (!rtfData?.rtfGoals?.goals || !exercise.exercise?.name) {
      return undefined;
    }
    
    return rtfData.rtfGoals.goals.find(
      goal => goal.exerciseName === exercise.exercise?.name
    );
  }, [rtfData?.rtfGoals?.goals, exercise.exercise?.name]);

  // Check if current week is a deload week
  const isCurrentDeloadWeek = useMemo(() => {
    if (!currentWeek || !routine?.programWithDeloads) return false;
    return isDeloadWeek(currentWeek, routine.programWithDeloads);
  }, [currentWeek, routine?.programWithDeloads]);

  const rtfVariant = exercise.progressionScheme ? getRtfVariant(exercise.progressionScheme) : null;

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">{exercise.exercise?.name || 'Unknown Exercise'}</h4>
        <div className="flex items-center gap-2">
          {exercise.progressionScheme && (
            <Badge variant="outline" className="text-xs">
              {exercise.progressionScheme.replace(/_/g, ' ')}
            </Badge>
          )}
          {rtfVariant && (
            <Badge 
              variant={rtfVariant === 'HYPERTROPHY' ? 'secondary' : 'default'} 
              className="text-xs"
            >
              {rtfVariant}
            </Badge>
          )}
          {isCurrentDeloadWeek && (
            <Badge variant="destructive" className="text-xs">
              Deload
            </Badge>
          )}
        </div>
      </div>

      {/* RtF-specific display */}
      {isRtfExercise && exerciseGoal && (
        <div className="mb-3 p-3 bg-muted/50 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Week {currentWeek} Goals</span>
            <span className="text-sm font-semibold text-primary">
              {Math.round(exerciseGoal.intensity * 100)}% Intensity
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="font-medium">{exerciseGoal.fixedReps} reps</div>
              <div className="text-muted-foreground">Base Sets</div>
            </div>
            <div>
              <div className="font-medium">{exerciseGoal.setsPlanned} sets</div>
              <div className="text-muted-foreground">Total</div>
            </div>
          </div>
          
          {exerciseGoal.amrapTarget && !exerciseGoal.isDeload && (
            <div className="mt-2 pt-2 border-t border-muted">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">AMRAP Target:</span>
                <span className="font-medium text-primary">{exerciseGoal.amrapTarget}+ reps</span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Traditional set display for non-RtF or when RtF data is not available */}
      {exercise.sets && exercise.sets.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {isRtfExercise ? 'Configured Sets:' : 'Sets:'}
          </p>
          {exercise.sets.map((set, index) => (
            <div key={set.id || index} className="text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                {index + 1}
              </span>
              <span>
                {set.reps || set.minReps || 0} reps @ {set.weight || 0}kg
                {set.rpe && ` (RPE ${set.rpe})`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Show message when RtF exercise has no traditional sets configured */}
      {isRtfExercise && (!exercise.sets || exercise.sets.length === 0) && !exerciseGoal && (
        <div className="text-sm text-muted-foreground italic">
          RtF progression - sets determined by weekly program
        </div>
      )}
    </div>
  );
};