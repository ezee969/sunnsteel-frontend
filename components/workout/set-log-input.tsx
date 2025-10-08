'use client';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useSetLogForm } from '@/hooks/use-set-log-form';
import type { LogRowProps } from '@/lib/utils/workout-session.types';

interface SetLogInputProps extends LogRowProps {
  plannedReps?: number | null;
  plannedMinReps?: number | null;
  plannedMaxReps?: number | null;
  plannedWeight?: number | null;
  rpe?: number;
}

/**
 * Reusable component for logging workout set data with auto-save functionality
 */
export const SetLogInput = ({
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
}: SetLogInputProps) => {
  const {
    repsState,
    weightState,
    isCompletedState,
    saveState,
    setReps,
    setWeight,
    handleCompletionToggle,
    isValid,
    validationError,
  } = useSetLogForm({
    sessionId,
    routineExerciseId,
    exerciseId,
    setNumber,
    initialReps: reps,
    initialWeight: weight,
    initialIsCompleted: isCompleted,
    onSave,
  });

  const plannedRepsText =
    plannedMinReps && plannedMaxReps
      ? `${plannedMinReps}-${plannedMaxReps}`
      : plannedReps ?? '—';

  return (
    <div
      data-testid="set-log-container"
      className={`rounded-lg border-2 p-4 transition-all duration-200 ${
        isCompletedState
          ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
          : 'border-border bg-card'
      }`}
    >
      {/* Header with set number, completion status, and save state */}
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
        
        {/* Completion checkbox */}
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

      {/* Form inputs */}
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
            onChange={(e) => setReps(e.target.value)}
            disabled={saveState === 'saving'}
            className={`text-center text-lg font-semibold h-12 ${
              !isValid && validationError?.includes('reps')
                ? 'border-red-500 focus:border-red-500'
                : ''
            }`}
          />
        </div>

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
            onChange={(e) => setWeight(e.target.value)}
            disabled={saveState === 'saving'}
            className={`text-center text-lg font-semibold h-12 ${
              !isValid && validationError?.includes('weight')
                ? 'border-red-500 focus:border-red-500'
                : ''
            }`}
          />
        </div>
      </div>

      {/* Validation error */}
      {!isValid && validationError && (
        <div className="mt-3 text-xs text-red-600 text-center">
          {validationError}
        </div>
      )}
      {/* Save state footer (silent unless error) */}
      {saveState === 'error' && (
        <div
          className="flex items-center justify-center mt-3 text-xs text-red-600 dark:text-red-400"
          role="status"
        >
          <span className="inline-block w-1.5 h-1.5 bg-current rounded-full mr-2" />
          <span>Error saving set. Please try again.</span>
        </div>
      )}
    </div>
  );
};