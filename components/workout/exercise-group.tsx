'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Dumbbell } from 'lucide-react';
import { SetLogInput } from './set-log-input';
import type { UpsertSetLogPayload } from '@/lib/utils/workout-session.types';

interface ExerciseGroupProps {
  exerciseId: string;
  exerciseName: string;
  sets: Array<{
    id: string;
    routineExerciseId: string;
    sessionId: string;
    setNumber: number;
    reps: number;
    weight?: number;
    rpe?: number;
    isCompleted: boolean;
    plannedReps?: number | null;
    plannedMinReps?: number | null;
    plannedMaxReps?: number | null;
    plannedWeight?: number | null;
  }>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  completedSets: number;
  totalSets: number;
  onSave: (payload: UpsertSetLogPayload) => void;
  amrapSetNumber?: number;
  hideAmrapLabel?: boolean;
}

/**
 * Reusable component for displaying collapsible exercise groups with set logs
 */
export const ExerciseGroup = ({
  exerciseId,
  exerciseName,
  sets,
  isCollapsed,
  onToggleCollapse,
  completedSets,
  totalSets,
  onSave,
  amrapSetNumber,
  hideAmrapLabel,
}: ExerciseGroupProps) => {
  const completionPercentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  const isComplete = completedSets === totalSets && totalSets > 0;

  return (
    <Card className={`transition-all duration-200 ${
      isComplete 
        ? 'border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-950/10' 
        : 'border-border'
    }`}>
      <CardHeader className="pb-3">
        <Button
          variant="ghost"
          onClick={onToggleCollapse}
          className="w-full justify-between p-0 h-auto hover:bg-transparent"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-base line-clamp-1">
                {exerciseName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {completedSets}/{totalSets} sets completed
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={isComplete ? "default" : "secondary"}
              className={`text-xs ${
                isComplete 
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                  : ""
              }`}
            >
              {Math.round(completionPercentage)}%
            </Badge>
            {isComplete && (
              <Badge 
                variant="secondary"
                className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              >
                ✓ Complete
              </Badge>
            )}
          </div>
        </Button>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {sets.map((set) => {
              const isAmrap = !!amrapSetNumber && set.setNumber === amrapSetNumber
              return (
                <div key={`${set.routineExerciseId}-${set.setNumber}`} className="space-y-1">
                  {isAmrap && !hideAmrapLabel && (
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                      AMRAP
                    </Badge>
                  )}
                  <SetLogInput
                    sessionId={set.sessionId}
                    routineExerciseId={set.routineExerciseId}
                    exerciseId={exerciseId}
                    setNumber={set.setNumber}
                    reps={set.reps}
                    weight={set.weight}
                    isCompleted={set.isCompleted}
                    plannedReps={set.plannedReps}
                    plannedMinReps={set.plannedMinReps}
                    plannedMaxReps={set.plannedMaxReps}
                    plannedWeight={set.plannedWeight}
                    rpe={set.rpe}
                    onSave={onSave}
                  />
                </div>
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
};