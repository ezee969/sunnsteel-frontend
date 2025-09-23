'use client';

import { FC, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ChevronsUpDown, Clock, Minus, Plus, Trash2 } from 'lucide-react';
import { Exercise } from '@/lib/api/types/exercise.type';
import { RepType, RoutineWizardData, ProgressionScheme } from './types';
import { formatTime } from '@/lib/utils/time';
import { formatMuscleGroups } from '@/lib/utils/muscle-groups';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InfoTooltip } from '@/components/InfoTooltip';
import { TooltipProvider } from '@/components/ui/tooltip';

export type RoutineSet = {
  setNumber: number;
  repType: RepType;
  reps?: number | null;
  minReps?: number | null;
  maxReps?: number | null;
  weight?: number;
};

export const SetRow: FC<{
  exerciseIndex: number;
  setIndex: number;
  set: RoutineSet;
  progressionScheme: ProgressionScheme;
  onUpdateSet: (
    exerciseIndex: number,
    setIndex: number,
    field: 'repType' | 'reps' | 'minReps' | 'maxReps' | 'weight',
    value: string
  ) => void;
  onValidateMinMaxReps: (
    exerciseIndex: number,
    setIndex: number,
    field: 'minReps' | 'maxReps'
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
}> = ({
  exerciseIndex,
  setIndex,
  set,
  progressionScheme,
  onUpdateSet,
  onValidateMinMaxReps,
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
  const [weightInput, setWeightInput] = useState<string>(
    set.weight !== undefined && set.weight !== null ? String(set.weight) : ''
  );

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

  useEffect(() => {
    setWeightInput(
      set.weight !== undefined && set.weight !== null ? String(set.weight) : ''
    );
  }, [set.weight]);

  const handleCommitMin = () => {
    const trimmed = minInput.trim();
    onUpdateSet(exerciseIndex, setIndex, 'minReps', trimmed === '' ? '' : trimmed);
    // Apply cross-validation after committing the value
    onValidateMinMaxReps(exerciseIndex, setIndex, 'minReps');
  };

  const handleCommitMax = () => {
    const trimmed = maxInput.trim();
    onUpdateSet(exerciseIndex, setIndex, 'maxReps', trimmed === '' ? '' : trimmed);
    // Apply cross-validation after committing the value
    onValidateMinMaxReps(exerciseIndex, setIndex, 'maxReps');
  };

  const handleCommitWeight = () => {
    const trimmed = weightInput.trim();
    if (trimmed === '') {
      onUpdateSet(exerciseIndex, setIndex, 'weight', '');
      return;
    }
    const value = parseFloat(trimmed);
    if (!Number.isNaN(value) && value >= 0) {
      onUpdateSet(exerciseIndex, setIndex, 'weight', String(value));
    } else {
      // Re-sync from parent if invalid
      setWeightInput(
        set.weight !== undefined && set.weight !== null ? String(set.weight) : ''
      );
    }
  };

  return (
    <div
      className={`bg-card border border-muted rounded-lg p-2 sm:p-0 sm:bg-transparent sm:border-0 sm:rounded-none transition-all duration-200 ${
        isRemoving
          ? 'animate-out fade-out-0 slide-out-to-top-2'
          : 'animate-in fade-in-0 slide-in-from-top-2'
      }`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-2 items-start sm:items-center">
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
              className="sm:hidden h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="sm:col-span-3">
          <div className="space-y-1">
            <Label className="sm:hidden text-xs font-medium text-muted-foreground">
              Rep Type
            </Label>
            <Select
              value={set.repType}
              onValueChange={(val) =>
                onUpdateSet(exerciseIndex, setIndex, 'repType', val)
              }
            >
              <SelectTrigger
                aria-label="Rep type"
                className="w-full"
                disabled={progressionScheme !== 'NONE'}
              >
                <SelectValue className="truncate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIXED">Fixed Reps</SelectItem>
                <SelectItem value="RANGE">Rep Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="sm:col-span-3">
          <div className="space-y-1">
            <Label className="sm:hidden text-xs font-medium text-muted-foreground">
              {set.repType === 'FIXED' ? 'Reps' : 'Rep Range'}
            </Label>
            {set.repType === 'FIXED' ? (
              <div className="flex items-center gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 p-0 shrink-0 sm:hidden"
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
                  className="h-9 w-9 p-0 shrink-0 sm:hidden"
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
                      className="h-8 w-8 p-0 shrink-0 inline-flex sm:hidden"
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
                      className="text-center h-8 flex-1 min-w-0 sm:min-w-[64px]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 p-0 shrink-0 inline-flex sm:hidden"
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
                      className="h-8 w-8 p-0 shrink-0 inline-flex sm:hidden"
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
                      className="h-8 w-8 p-0 shrink-0 inline-flex sm:hidden"
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
            <Label className="sm:hidden text-xs font-medium text-muted-foreground">
              Weight
            </Label>
            <div className="flex items-center gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 p-0 shrink-0 sm:hidden"
                aria-label="Decrease weight"
                disabled={progressionScheme === 'DOUBLE_PROGRESSION' && setIndex > 0}
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
                value={weightInput}
                onChange={(e) => {
                  const raw = e.target.value;
                  const sanitized = raw
                    .replace(/[^0-9.]/g, '')
                    .replace(/(\..*)\./g, '$1'); // Allow only one dot
                  setWeightInput(sanitized);
                }}
                onBlur={handleCommitWeight}
                disabled={progressionScheme === 'DOUBLE_PROGRESSION' && setIndex > 0}
                className={`text-center h-8 flex-1 min-w-0 ${
                  progressionScheme === 'DOUBLE_PROGRESSION' && setIndex > 0
                    ? 'cursor-not-allowed opacity-60'
                    : ''
                }`}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 p-0 shrink-0 sm:hidden"
                aria-label="Increase weight"
                disabled={progressionScheme === 'DOUBLE_PROGRESSION' && setIndex > 0}
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
  onUpdateProgressionScheme: (
    exerciseIndex: number,
    scheme: ProgressionScheme
  ) => void;
  onUpdateMinWeightIncrement: (exerciseIndex: number, increment: number) => void;
  onUpdateProgramTMKg: (exerciseIndex: number, tmKg: number) => void;
  onUpdateProgramRoundingKg: (exerciseIndex: number, roundingKg: number) => void;
  onAddSet: (exerciseIndex: number) => void;
  isRemovingSet: (exerciseIndex: number, setIndex: number) => boolean;
  onRemoveSetAnimated: (exerciseIndex: number, setIndex: number) => void;
  onRemoveSet?: (exerciseIndex: number, setIndex: number) => void;
  onUpdateSet: (
    exerciseIndex: number,
    setIndex: number,
    field: 'repType' | 'reps' | 'minReps' | 'maxReps' | 'weight',
    value: string
  ) => void;
  onValidateMinMaxReps: (
    exerciseIndex: number,
    setIndex: number,
    field: 'minReps' | 'maxReps'
  ) => void;
  onStepFixedReps: (exerciseIndex: number, setIndex: number, delta: number) => void;
  onStepRangeReps: (
    exerciseIndex: number,
    setIndex: number,
    field: 'minReps' | 'maxReps',
    delta: number
  ) => void;
  onStepWeight: (exerciseIndex: number, setIndex: number, delta: number) => void;
  disableTimeBasedProgressions?: boolean;
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
  onUpdateProgressionScheme,
  onUpdateMinWeightIncrement,
  onUpdateProgramTMKg,
  onUpdateProgramRoundingKg,
  onAddSet,
  isRemovingSet,
  onRemoveSetAnimated,
  onUpdateSet,
  onValidateMinMaxReps,
  onStepFixedReps,
  onStepRangeReps,
  onStepWeight,
  disableTimeBasedProgressions,
}) => {
  const setRowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [shouldScrollToLast, setShouldScrollToLast] = useState(false);
  const [setsExpanded, setSetsExpanded] = useState(true);
  const [weightIncInput, setWeightIncInput] = useState<string>(
    exercise.minWeightIncrement !== undefined && exercise.minWeightIncrement !== null
      ? String(exercise.minWeightIncrement)
      : ''
  );

  useEffect(() => {
    if (!shouldScrollToLast) return;
    const last = setRowRefs.current[exercise.sets.length - 1];
    if (last) {
      last.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    setShouldScrollToLast(false);
  }, [exercise.sets.length, shouldScrollToLast]);

  // Sync local weight increment input when parent value changes
  useEffect(() => {
    const parentVal = exercise.minWeightIncrement;
    setWeightIncInput(
      parentVal !== undefined && parentVal !== null ? String(parentVal) : ''
    );
  }, [exercise.minWeightIncrement]);

  return (
    <Card key={exerciseIndex} className="border-muted overflow-hidden p-0">
      <CardHeader
        className={`cursor-pointer transition-all duration-200 hover:bg-muted/30 ${
          expanded ? 'p-3 sm:p-4' : 'p-2 sm:p-3'
        }`}
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
        <div
          className={`flex items-center justify-between ${
            expanded ? 'gap-3' : 'gap-2'
          }`}
        >
          {/* Exercise info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex-1 min-w-0">
                <h4
                  className={`font-medium truncate ${
                    expanded ? 'text-base sm:text-base' : 'text-sm sm:text-base'
                  }`}
                >
                  {exerciseData?.name || 'Exercise'}
                </h4>
                {expanded && (
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {exerciseData?.primaryMuscles
                      ? formatMuscleGroups(exerciseData.primaryMuscles)
                      : 'Unknown'}{' '}
                    • {exerciseData?.equipment}
                  </p>
                )}
              </div>
              {!expanded && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  {exercise.progressionScheme !== 'PROGRAMMED_RTF' && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0.5 h-5"
                      >
                        {exercise.sets.length}
                      </Badge>
                    )}
                  <div className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    <span className="text-[10px] sm:text-xs">
                      {Math.floor(exercise.restSeconds / 60)}:
                      {(exercise.restSeconds % 60).toString().padStart(2, '0')}
                    </span>
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
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(exerciseIndex);
              }}
              className={`p-0 ${expanded ? 'h-8 w-8' : 'h-6 w-6'}`}
            >
              <ChevronsUpDown
                className={`transition-transform duration-300 ease-in-out ${
                  expanded ? 'h-4 w-4 rotate-180' : 'h-3 w-3'
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Remove exercise"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveExercise(exerciseIndex);
              }}
              className={`p-0 text-muted-foreground hover:text-destructive ${
                expanded ? 'h-8 w-8' : 'h-6 w-6'
              }`}
            >
              <Trash2 className={expanded ? 'h-4 w-4' : 'h-3 w-3'} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent
        className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${
          expanded ? 'max-h-[3000px]' : 'max-h-0'
        }`}
      >
        <div
          id={`sets-${tabIndex}-${exerciseIndex}`}
          className={`p-0 sm:p-1 transition-opacity duration-300 ease-in-out ${
            expanded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Exercise configuration */}
          <div className="mb-3 p-2 sm:p-3 bg-muted/30 rounded-lg space-y-2 sm:space-y-3">
            {/* Rest timer */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium text-muted-foreground">
                  Rest
                </Label>
              </div>
              <Input
                aria-label="Rest time"
                placeholder="0:00"
                value={formatTime(exercise.restSeconds)}
                onChange={(e) => onUpdateRestTime(exerciseIndex, e.target.value)}
                className="w-32 sm:w-40 h-9 text-sm text-center"
              />
            </div>

            {/* Progression scheme */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Progression
                </Label>
                {disableTimeBasedProgressions && (
                  <TooltipProvider>
                    <InfoTooltip
                      content="Time-based progressions are disabled. Switch Program Schedule to Timeframe in Basic Info to enable."
                      side="right"
                    />
                  </TooltipProvider>
                )}
              </div>
              {disableTimeBasedProgressions && (
                <span className="text-xs text-muted-foreground italic">
                  Time-based progressions are disabled
                </span>
              )}
              <Select
                value={exercise.progressionScheme}
                onValueChange={(val) => {
                  const newScheme = val as ProgressionScheme;
                  onUpdateProgressionScheme(exerciseIndex, newScheme);
                }}
              >
                <SelectTrigger
                  aria-label="Progression scheme"
                  size="sm"
                  className="w-32 sm:w-40 max-w-[60vw] h-9 truncate"
                >
                  <SelectValue className="truncate" />
                </SelectTrigger>
                <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-none">
                  <SelectItem value="NONE">None</SelectItem>
                  <SelectItem value="DOUBLE_PROGRESSION">
                    Double Progression
                  </SelectItem>
                  <SelectItem value="DYNAMIC_DOUBLE_PROGRESSION">
                    Dynamic Double Progression
                  </SelectItem>
                  <SelectItem
                    value="PROGRAMMED_RTF"
                    disabled={!!disableTimeBasedProgressions}
                    title={
                      disableTimeBasedProgressions
                        ? 'Requires Timeframe schedule (set in Basic Info)'
                        : undefined
                    }
                  >
                    RtF (4 fixed + 1 AMRAP)
                  </SelectItem>
                  {/* Removed PROGRAMMED_RTF_HYPERTROPHY option (deprecated) */}
                </SelectContent>
              </Select>
            </div>

            {/* RtF per-exercise fields */}
            {(() => {
              const isRtf = exercise.progressionScheme === 'PROGRAMMED_RTF'
              if (!isRtf) return null;
              const tmMissing =
                exercise.programTMKg === undefined ||
                Number.isNaN(exercise.programTMKg as number);
              const helpId = `tm-help-${tabIndex}-${exerciseIndex}`;
              return (
                <div className="grid grid-cols-1 gap-2 sm:gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium text-muted-foreground">
                          TM
                        </Label>
                      </div>
                      <Input
                        aria-label="Training Max"
                        aria-invalid={tmMissing}
                        aria-describedby={helpId}
                        inputMode="decimal"
                        pattern="[0-9]*[.]?[0-9]*"
                        placeholder="e.g. 100"
                        value={exercise.programTMKg ?? ''}
                        onChange={(e) => {
                          const val = parseFloat(
                            e.target.value.replace(/[^0-9.]/g, '')
                          );
                          if (!Number.isNaN(val)) {
                            onUpdateProgramTMKg(exerciseIndex, val);
                          } else if (e.target.value === '') {
                            onUpdateProgramTMKg(exerciseIndex, NaN);
                          }
                        }}
                        className={`w-32 sm:w-40 h-8 text-sm text-center ${
                          tmMissing
                            ? 'border-destructive focus-visible:ring-destructive'
                            : ''
                        }`}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Rounding
                      </Label>
                    </div>
                    <Select
                      value={(exercise.programRoundingKg ?? 2.5).toString()}
                      onValueChange={(val) =>
                        onUpdateProgramRoundingKg(exerciseIndex, parseFloat(val))
                      }
                    >
                      <SelectTrigger
                        aria-label="Rounding increment"
                        size="sm"
                        className="w-32 sm:w-40 truncate"
                      >
                        <SelectValue className="truncate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.5">0.5</SelectItem>
                        <SelectItem value="1">1.0</SelectItem>
                        <SelectItem value="2.5">2.5</SelectItem>
                        <SelectItem value="5">5.0</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })()}

            {/* Weight increment (only for non-RtF progression schemes) */}
            {exercise.progressionScheme !== 'NONE' &&
              exercise.progressionScheme !== 'PROGRAMMED_RTF' && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Weight Inc.
                    </Label>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-2">
                    <Input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*[.]?[0-9]*"
                      autoComplete="off"
                      aria-label="Minimum weight increment"
                      placeholder="2.5"
                      value={weightIncInput}
                      onChange={(e) => {
                        // Allow only digits and a single dot; allow empty string
                        const raw = e.target.value;
                        const sanitized = raw
                          .replace(/[^0-9.]/g, '')
                          .replace(/(\..*)\./g, '$1');
                        setWeightIncInput(sanitized);
                      }}
                      onBlur={() => {
                        const trimmed = weightIncInput.trim();
                        if (trimmed === '') {
                          // Keep empty display; do not update parent to avoid forcing a value back
                          return;
                        }
                        const value = parseFloat(trimmed);
                        if (!Number.isNaN(value) && value > 0) {
                          onUpdateMinWeightIncrement(exerciseIndex, value);
                        } else {
                          // Re-sync from parent if invalid
                          const parentVal = exercise.minWeightIncrement;
                          setWeightIncInput(
                            parentVal !== undefined && parentVal !== null
                              ? String(parentVal)
                              : ''
                          );
                        }
                      }}
                      className="w-32 sm:w-40 h-9 text-sm text-center"
                    />
                  </div>
                </div>
              )}
          </div>

          {/* Sets header with collapse/expand */}
          {(() => {
            const isRtFActive = exercise.progressionScheme === 'PROGRAMMED_RTF'
            if (isRtFActive) {
              // Hide sets UI entirely for RtF exercises
              return null;
            }
            return (
              <>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h5 className="text-sm font-medium">Sets</h5>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Toggle set rows"
                    aria-expanded={setsExpanded}
                    aria-controls={`sets-list-${tabIndex}-${exerciseIndex}`}
                    onClick={() => setSetsExpanded((v) => !v)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsUpDown
                      className={`h-4 w-4 transition-transform duration-300 ease-in-out ${
                        setsExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </Button>
                </div>

                {setsExpanded && (
                  <div id={`sets-list-${tabIndex}-${exerciseIndex}`}>
                    {/* Desktop headers */}
                    <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground mb-2 px-1">
                      <div className="col-span-2">Set</div>
                      <div className="col-span-3">Type</div>
                      <div className="col-span-3">Reps</div>
                      <div className="col-span-2">Weight</div>
                      <div className="col-span-2"></div>
                    </div>

                    {/* Sets container */}
                    <div className="space-y-1.5 px-2 sm:px-0">
                      {exercise.sets.map((set, setIndex) => (
                        <div
                          key={setIndex}
                          ref={(el) => {
                            setRowRefs.current[setIndex] = el;
                          }}
                        >
                          <SetRow
                            exerciseIndex={exerciseIndex}
                            setIndex={setIndex}
                            set={set}
                            progressionScheme={exercise.progressionScheme}
                            onUpdateSet={onUpdateSet}
                            onValidateMinMaxReps={onValidateMinMaxReps}
                            onStepFixedReps={onStepFixedReps}
                            onStepRangeReps={onStepRangeReps}
                            onStepWeight={onStepWeight}
                            onRemoveSet={() =>
                              onRemoveSetAnimated(exerciseIndex, setIndex)
                            }
                            isRemoving={isRemovingSet(exerciseIndex, setIndex)}
                            disableRemove={exercise.sets.length === 1}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Add set button */}
                    <div className="mt-3 pt-3 border-t border-muted px-2 sm:px-0 sm:border-0">
                      <Button
                        data-testid={`add-set-btn-${tabIndex}-${exerciseIndex}`}
                        onClick={() => {
                          setShouldScrollToLast(true);
                          onAddSet(exerciseIndex);
                        }}
                        variant="outline"
                        className="w-full h-10 text-base mb-3"
                        disabled={
                          exercise.sets.length >= 10 ||
                          exercise.progressionScheme === 'PROGRAMMED_RTF'
                        }
                        title={
                          exercise.progressionScheme === 'PROGRAMMED_RTF'
                            ? 'Sets are handled by RtF progression'
                            : undefined
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Set
                      </Button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
};
