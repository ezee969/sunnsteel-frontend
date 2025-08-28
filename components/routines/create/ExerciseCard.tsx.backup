'use client';

import { FC, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronsUpDown, Clock, Minus, Plus, Trash2 } from 'lucide-react';
import { Exercise } from '@/lib/api/types/exercise.type';
import { RepType, RoutineWizardData } from './types';
import { formatTime } from '@/lib/utils/time';

export type RoutineSet = {
  setNumber: number;
  repType: RepType;
  reps?: number | null;
  minReps?: number | null;
  maxReps?: number | null;
  weight?: number;
};

interface SetRowProps {
  exerciseIndex: number;
  setIndex: number;
  set: RoutineSet;
  onUpdateSet: (
    exerciseIndex: number,
    setIndex: number,
    field: 'repType' | 'reps' | 'minReps' | 'maxReps' | 'weight',
    value: string
  ) => void;
  onStepFixedReps: (exerciseIndex: number, setIndex: number, delta: number) => void;
  onStepRangeReps: (
    exerciseIndex: number,
    setIndex: number,
    field: 'minReps' | 'maxReps',
    delta: number
  ) => void;
  onStepWeight: (exerciseIndex: number, setIndex: number, delta: number) => void;
  onRemoveSet: () => void;
  isRemoving: boolean;
  disableRemove: boolean;
}

export const SetRow: FC<SetRowProps> = ({
  exerciseIndex,
  setIndex,
  set,
  onUpdateSet,
  onStepFixedReps,
  onStepRangeReps,
  onStepWeight,
  onRemoveSet,
  isRemoving,
  disableRemove,
}) => {
  // Local input state for range fields to allow smooth typing without premature clamping
  const [minInput, setMinInput] = useState<string>(set.minReps?.toString() ?? '');
  const [maxInput, setMaxInput] = useState<string>(set.maxReps?.toString() ?? '');

  // Sync local state when set changes from parent updates (e.g., steppers, cross-clamp)
  useEffect(() => {
    setMinInput(
      set.minReps !== null && set.minReps !== undefined ? String(set.minReps) : ''
    );
  }, [set.minReps]);

  useEffect(() => {
    setMaxInput(
      set.maxReps !== null && set.maxReps !== undefined ? String(set.maxReps) : ''
    );
  }, [set.maxReps]);

  const handleCommitMin = () => {
    const trimmed = minInput.trim();
    onUpdateSet(exerciseIndex, setIndex, 'minReps', trimmed === '' ? '' : trimmed);
  };

  const handleCommitMax = () => {
    const trimmed = maxInput.trim();
    onUpdateSet(exerciseIndex, setIndex, 'maxReps', trimmed === '' ? '' : trimmed);
  };

  return (
    <div
      className={`bg-card border border-muted rounded-lg p-3 sm:p-0 sm:bg-transparent sm:border-0 sm:rounded-none transition-all duration-200 ${
        isRemoving
          ? 'animate-out fade-out-0 slide-out-to-top-2'
          : 'animate-in fade-in-0 slide-in-from-top-2'
      }`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-2 items-start sm:items-center">
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between sm:justify-start">
            <Badge variant="outline" className="text-xs px-2 py-1">
              Set {set.setNumber}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemoveSet}
              aria-label="Remove set"
              disabled={disableRemove}
              className="sm:hidden h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="sm:col-span-3">
          <div className="space-y-1">
            <div className="sm:hidden text-xs font-medium text-muted-foreground">Rep Type</div>
            <select
              aria-label="Rep type"
              value={set.repType}
              onChange={(e) =>
                onUpdateSet(exerciseIndex, setIndex, 'repType', e.target.value)
              }
              className="w-full h-9 rounded-md border bg-background px-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="FIXED">Fixed Reps</option>
              <option value="RANGE">Rep Range</option>
            </select>
          </div>
        </div>

        <div className="sm:col-span-3">
          <div className="space-y-1">
            <div className="sm:hidden text-xs font-medium text-muted-foreground">
              {set.repType === 'FIXED' ? 'Reps' : 'Rep Range'}
            </div>
            {set.repType === 'FIXED' ? (
              <div className="flex items-center gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 p-0 shrink-0"
                  aria-label="Decrease reps"
                  onClick={() => onStepFixedReps(exerciseIndex, setIndex, -1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  aria-label="Reps"
                  placeholder="0"
                  value={set.reps ?? ''}
                  onChange={(e) => {
                    const next = e.target.value.replace(/[^0-9]/g, '');
                    onUpdateSet(exerciseIndex, setIndex, 'reps', next);
                  }}
                  className="text-center h-8 flex-1 min-w-0"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 p-0 shrink-0"
                  aria-label="Increase reps"
                  onClick={() => onStepFixedReps(exerciseIndex, setIndex, 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="w-full">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-2 w-full">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 p-0 shrink-0 hidden sm:inline-flex"
                      aria-label="Decrease minimum reps"
                      onClick={() =>
                        onStepRangeReps(exerciseIndex, setIndex, 'minReps', -1)
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="text"
                      aria-label="Min reps"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Min"
                      autoComplete="off"
                      value={minInput}
                      onChange={(e) => {
                        const next = e.target.value.replace(/[^0-9]/g, '');
                        setMinInput(next);
                        onUpdateSet(
                          exerciseIndex,
                          setIndex,
                          'minReps',
                          next === '' ? '' : next
                        );
                      }}
                      onBlur={handleCommitMin}
                      className="text-center h-8 flex-1 min-w-0"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 p-0 shrink-0 hidden sm:inline-flex"
                      aria-label="Increase minimum reps"
                      onClick={() =>
                        onStepRangeReps(exerciseIndex, setIndex, 'minReps', 1)
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="hidden sm:inline text-muted-foreground">-</span>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 p-0 shrink-0 hidden sm:inline-flex"
                      aria-label="Decrease maximum reps"
                      onClick={() =>
                        onStepRangeReps(exerciseIndex, setIndex, 'maxReps', -1)
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="text"
                      aria-label="Max reps"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Max"
                      autoComplete="off"
                      value={maxInput}
                      onChange={(e) => {
                        const next = e.target.value.replace(/[^0-9]/g, '');
                        setMaxInput(next);
                        onUpdateSet(
                          exerciseIndex,
                          setIndex,
                          'maxReps',
                          next === '' ? '' : next
                        );
                      }}
                      onBlur={handleCommitMax}
                      className="text-center h-8 flex-1 min-w-0"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 p-0 shrink-0 hidden sm:inline-flex"
                      aria-label="Increase maximum reps"
                      onClick={() =>
                        onStepRangeReps(exerciseIndex, setIndex, 'maxReps', 1)
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sm:col-span-2">
          <div className="space-y-1">
            <div className="sm:hidden text-xs font-medium text-muted-foreground">Weight (kg)</div>
            <div className="flex items-center gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 p-0 shrink-0"
                aria-label="Decrease weight"
                onClick={() => onStepWeight(exerciseIndex, setIndex, -1)}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.]?[0-9]*"
                autoComplete="off"
                aria-label="Weight"
                placeholder="0"
                value={set.weight ?? ''}
                onChange={(e) => {
                  const next = e.target.value.replace(/[^0-9.]/g, '');
                  onUpdateSet(exerciseIndex, setIndex, 'weight', next);
                }}
                className="text-center h-8 flex-1 min-w-0"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 p-0 shrink-0"
                aria-label="Increase weight"
                onClick={() => onStepWeight(exerciseIndex, setIndex, 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex sm:col-span-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemoveSet}
            aria-label="Remove set"
            disabled={disableRemove}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

interface ExerciseCardProps {
  tabIndex: number;
  exerciseIndex: number;
  exercise: RoutineWizardData['days'][number]['exercises'][number];
  exerciseData?: Exercise;
  expanded: boolean;
  onToggleExpand: (exerciseIndex: number) => void;
  onRemoveExercise: (exerciseIndex: number) => void;
  onUpdateRestTime: (exerciseIndex: number, timeStr: string) => void;
  onAddSet: (exerciseIndex: number) => void;
  isRemovingSet: (exerciseIndex: number, setIndex: number) => boolean;
  onRemoveSetAnimated: (exerciseIndex: number, setIndex: number) => void;
  onUpdateSet: SetRowProps['onUpdateSet'];
  onStepFixedReps: SetRowProps['onStepFixedReps'];
  onStepRangeReps: SetRowProps['onStepRangeReps'];
  onStepWeight: SetRowProps['onStepWeight'];
}

export const ExerciseCard: FC<ExerciseCardProps> = ({
  tabIndex,
  exerciseIndex,
  exercise,
  exerciseData,
  expanded,
  onToggleExpand,
  onRemoveExercise,
  onUpdateRestTime,
  onAddSet,
  isRemovingSet,
  onRemoveSetAnimated,
  onUpdateSet,
  onStepFixedReps,
  onStepRangeReps,
  onStepWeight,
}) => {
  return (
    <Card key={exerciseIndex} className="border-muted overflow-hidden">
      <CardHeader className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          {/* Exercise info - clickable to expand */}
          <div
            className="flex-1 cursor-pointer min-w-0"
            role="button"
            tabIndex={0}
            aria-label="Toggle exercise sets"
            aria-expanded={expanded}
            aria-controls={`sets-${tabIndex}-${exerciseIndex}`}
            onClick={() => onToggleExpand(exerciseIndex)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleExpand(exerciseIndex);
              }
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm sm:text-base truncate">
                  {exerciseData?.name || 'Exercise'}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {exerciseData?.primaryMuscle} • {exerciseData?.equipment}
                </p>
              </div>
              {!expanded && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {exercise.sets.length} set{exercise.sets.length !== 1 ? 's' : ''}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{Math.floor(exercise.restSeconds / 60)}:{(exercise.restSeconds % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Toggle sets"
              aria-expanded={expanded}
              aria-controls={`sets-${tabIndex}-${exerciseIndex}`}
              onClick={() => onToggleExpand(exerciseIndex)}
              className="h-8 w-8 p-0"
            >
              <ChevronsUpDown className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Remove exercise"
              onClick={() => onRemoveExercise(exerciseIndex)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={`transition-all duration-300 ease-in-out overflow-hidden ${
        expanded ? 'p-3 sm:p-4 pt-0' : 'p-0 max-h-0'
      }`}>
        <div
          id={`sets-${tabIndex}-${exerciseIndex}`}
          className={`transition-all duration-300 ease-in-out ${
            expanded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`}
        >
          {/* Rest timer and controls */}
          <div className="mb-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Rest</span>
              </div>
              <Input
                aria-label="Rest time"
                placeholder="0:00"
                value={formatTime(exercise.restSeconds)}
                onChange={(e) => onUpdateRestTime(exerciseIndex, e.target.value)}
                className="w-20 h-8 text-sm text-center"
              />
            </div>
          </div>

          {/* Desktop headers */}
          <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground mb-2 px-1">
            <div className="col-span-2">Set</div>
            <div className="col-span-3">Type</div>
            <div className="col-span-3">Reps</div>
            <div className="col-span-2">Weight</div>
            <div className="col-span-2"></div>
          </div>

          {/* Sets container */}
          <div className="space-y-2">
            {exercise.sets.map((set, setIndex) => (
              <SetRow
                key={setIndex}
                exerciseIndex={exerciseIndex}
                setIndex={setIndex}
                set={set}
                onUpdateSet={onUpdateSet}
                onStepFixedReps={onStepFixedReps}
                onStepRangeReps={onStepRangeReps}
                onStepWeight={onStepWeight}
                onRemoveSet={() => onRemoveSetAnimated(exerciseIndex, setIndex)}
                isRemoving={isRemovingSet(exerciseIndex, setIndex)}
                disableRemove={exercise.sets.length === 1}
              />
            ))}
          </div>

          {/* Add set button */}
          <div className="mt-4 pt-3 border-t border-muted">
            <Button
              onClick={() => onAddSet(exerciseIndex)}
              variant="outline"
              className="w-full h-9"
              disabled={exercise.sets.length >= 10}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Set
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
