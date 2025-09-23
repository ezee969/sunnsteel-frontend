'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useSidebar } from '@/hooks/use-sidebar';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { RoutineWizardData } from './types';
import { useMemo } from 'react';
import { generateRepsToFailureProgram } from '@/lib/utils/reps-to-failure';
import { useState as useReactState } from 'react';
import { deriveAdjustmentsFromLog, TmTrendBuffer } from '@/lib/analytics/tm-trend';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select as UiSelect, SelectTrigger as UiSelectTrigger, SelectContent as UiSelectContent, SelectItem as UiSelectItem, SelectValue as UiSelectValue } from '@/components/ui/select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TrainingDaysProps {
  data: RoutineWizardData;
  onUpdate: (updates: Partial<RoutineWizardData>) => void;
  isEditing?: boolean; // when true, hide Start Week control (create-only feature)
}

const DAYS_OF_WEEK = [
  { id: 0, name: 'Sunday', short: 'Sun' },
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
];

const COMMON_SPLITS = [
  {
    name: 'Push/Pull/Legs',
    days: [1, 3, 5],
    description: '3-day split: Mon, Wed, Fri',
  },
  {
    name: 'Push/Pull/Legs (x6)',
    days: [1, 2, 3, 4, 5, 6],
    description: '6-day split: Mon-Sat (Push, Pull, Legs, Push, Pull, Legs)',
  },
  {
    name: 'Upper/Lower',
    days: [1, 2, 4, 5],
    description: '4-day split: Mon, Tue, Thu, Fri',
  },
  {
    name: 'Full Body',
    days: [1, 3, 5],
    description: '3-day full body: Mon, Wed, Fri',
  },
  { name: 'Bro Split', days: [1, 2, 3, 4, 5], description: '5-day split: Mon-Fri' },
];

export function TrainingDays({ data, onUpdate, isEditing = false }: TrainingDaysProps) {
  const { isMobile } = useSidebar();
  const [hasInteracted, setHasInteracted] = useState(data.trainingDays.length > 0);
  const usesRtf = data.days.some((d) =>
    d.exercises.some((ex) => ex.progressionScheme === 'PROGRAMMED_RTF')
  )

  const totalWeeks = (data.programWithDeloads ? 21 : 18) as 18 | 21;

  // Generate a lightweight preview (first 6 weeks) of RtF program when any exercise uses RtF.
  const rtfExercises = useMemo(
    () => data.days.flatMap(d => d.exercises).filter(e => e.progressionScheme === 'PROGRAMMED_RTF'),
    [data.days]
  )
  const [previewExerciseId, setPreviewExerciseId] = useReactState<string | undefined>(
    rtfExercises[0]?.exerciseId
  )
  const selectedExercise = rtfExercises.find(e => e.exerciseId === previewExerciseId) || rtfExercises[0]
  const rtfPreview = useMemo(() => {
    if (!usesRtf || !selectedExercise) return [] as { week: number; goal: string; weight: number }[]
    const tm = selectedExercise.programTMKg ?? 100
    const rounding = selectedExercise.programRoundingKg ?? 5
    const style = data.programStyle || 'STANDARD'
    const withDeloads = data.programWithDeloads !== false
    const logs = generateRepsToFailureProgram({ initialWeight: tm, style, withDeloads, roundingIncrementKg: rounding }, [])
    return logs.slice(0, 6).map(l => ({ week: l.week, goal: l.goal, weight: l.weight }))
  }, [selectedExercise, data.programStyle, data.programWithDeloads, usesRtf])

  // Full program generation (memoized) for modal & analytics
  const fullProgram = useMemo(() => {
    if (!usesRtf || !selectedExercise) return [] as ReturnType<typeof generateRepsToFailureProgram>
    const tm = selectedExercise.programTMKg ?? 100
    const rounding = selectedExercise.programRoundingKg ?? 5
    const style = data.programStyle || 'STANDARD'
    const withDeloads = data.programWithDeloads !== false
    return generateRepsToFailureProgram({ initialWeight: tm, style, withDeloads, roundingIncrementKg: rounding }, [])
  }, [selectedExercise, data.programStyle, data.programWithDeloads, usesRtf])

  // Basic in-memory analytics (derive TM adjustments)
  const tmTrend = useMemo(() => {
    if (!fullProgram.length) return null
    const buffer = new TmTrendBuffer()
    deriveAdjustmentsFromLog(fullProgram, (data.programStyle || 'STANDARD'), selectedExercise?.exerciseId).forEach(e => buffer.push(e))
    return buffer.snapshot(data.programStyle || 'STANDARD', selectedExercise?.exerciseId)
  }, [fullProgram, data.programStyle, selectedExercise])

  // Auto-fill timezone from browser when using RtF and not yet set
  useEffect(() => {
    if (!usesRtf) return;
    const tz = data.programTimezone?.trim();
    if (tz && tz.length > 0) return;
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (browserTz) {
      onUpdate({ programTimezone: browserTz });
    }
  }, [usesRtf, data.programTimezone, onUpdate]);

  // Default start week to 1 for RtF when unset
  useEffect(() => {
    if (!usesRtf) return;
    if (!data.programStartWeek || data.programStartWeek < 1) {
      onUpdate({ programStartWeek: 1 });
    }
  }, [usesRtf, data.programStartWeek, onUpdate]);
  const toggleDay = (dayId: number) => {
    const isSelected = data.trainingDays.includes(dayId);
    let newTrainingDays: number[];

    if (!hasInteracted) {
      setHasInteracted(true);
    }

    if (isSelected) {
      newTrainingDays = data.trainingDays.filter((id) => id !== dayId);
    } else {
      newTrainingDays = [...data.trainingDays, dayId].sort();
    }

    // Update the days array to match the selected training days
    const newDays = newTrainingDays.map((dayId) => ({
      dayOfWeek: dayId,
      exercises: data.days.find((d) => d.dayOfWeek === dayId)?.exercises || [],
    }));

    onUpdate({
      trainingDays: newTrainingDays,
      days: newDays,
    });
  };

  const selectSplit = (splitDays: number[]) => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }

    // If the clicked split matches the current selection, clear it
    const isSameSelection = 
      data.trainingDays.length === splitDays.length &&
      data.trainingDays.every(day => splitDays.includes(day));

    if (isSameSelection) {
      onUpdate({
        trainingDays: [],
        days: [],
      });
      return;
    }

    // Otherwise, select the split
    const newDays = splitDays.map((dayId) => ({
      dayOfWeek: dayId,
      exercises: data.days.find((d) => d.dayOfWeek === dayId)?.exercises || [],
    }));

    onUpdate({
      trainingDays: [...splitDays],
      days: newDays,
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4">
          Which days will you train?
          <span className="text-destructive ml-1">*</span>
        </h3>

        {/* Common Splits */}
        <div className="mb-3 md:mb-4">
          <p className="text-xs text-muted-foreground mb-1.5 md:mb-2">
            Quick select common splits:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 md:gap-2">
            {COMMON_SPLITS.map((split) => (
              <Card
                key={split.name}
                className={cn(
                  'cursor-pointer transition-all hover:bg-muted/50 active:scale-[0.98]',
                  'border-border/50',
                  JSON.stringify(data.trainingDays.sort()) === JSON.stringify(split.days.sort())
                    ? 'ring-1 ring-primary bg-muted/30'
                    : '',
                  isMobile ? 'h-16' : 'h-20'
                )}
                onClick={() => selectSplit(split.days)}
              >
                <CardContent className="p-1.5 md:p-2 h-full">
                  <div className="flex flex-col h-full justify-between">
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="font-medium text-xs md:text-sm truncate">{split.name}</h4>
                      <Badge variant="outline" className="shrink-0 text-[10px] md:text-xs h-5 px-1.5">
                        {split.days.length}d
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                      {split.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Manual Day Selection */}
        <div>
          <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
            Or select days manually:
          </p>
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <Button
                key={day.id}
                variant={data.trainingDays.includes(day.id) ? 'default' : 'outline'}
                onClick={() => toggleDay(day.id)}
                className={cn(
                  'flex flex-col h-auto p-1.5 md:p-3 text-xs md:text-sm',
                  isMobile && 'h-10 w-10 p-0 flex items-center justify-center'
                )}
                size={isMobile ? 'icon' : 'sm'}
              >
                {isMobile ? (
                  <span className="font-medium text-xs">{day.short.charAt(0)}</span>
                ) : (
                  <>
                    <span className="font-medium">{day.short}</span>
                    <span className="hidden sm:block text-[10px] md:text-xs opacity-80">
                      {day.name.substring(0, 3)}
                    </span>
                  </>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Days Summary */}
      <div className="bg-muted/50 p-3 md:p-4 rounded-lg">
        <h4 className="font-medium text-sm md:text-base mb-2 md:mb-3">
          Selected Training Days ({data.trainingDays.length} days/week)
        </h4>
        <div className="relative min-h-[56px] md:min-h-[28px]">
          {/* Placeholder Text - positioned over the grid */}
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center transition-opacity',
              data.trainingDays.length === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          >
            <p className="text-muted-foreground text-sm text-center">
              Select at least one training day to continue
            </p>
          </div>

          {/* Badges Grid - items are always in the layout, visibility is toggled */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 md:gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <Badge
                key={day.id}
                variant="secondary"
                className={cn(
                  'w-full text-center text-xs md:text-sm px-1 py-1 transition-opacity duration-300',
                  data.trainingDays.includes(day.id) ? 'opacity-100' : 'opacity-0'
                )}
              >
                {day.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* RtF Program Settings (shown only if any exercise uses RtF). Start date is configured in Basic Info. */}
      {usesRtf && (
        <div className="bg-muted/30 p-3 md:p-4 rounded-lg space-y-3">
          <h4 className="font-medium text-sm md:text-base">RtF Program Settings</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Include deload weeks</span>
              <Checkbox
                aria-label="Include deload weeks"
                checked={!!data.programWithDeloads}
                onCheckedChange={(checked: boolean) => {
                  const nextWithDeloads = Boolean(checked)
                  const nextTotal = nextWithDeloads ? 21 : 18
                  const curStart = data.programStartWeek ?? 1
                  let clampedStart = Math.min(curStart, nextTotal)
                  if (!nextWithDeloads && curStart > 18) {
                    // Provide immediate user feedback; keep minimal intrusive approach
                    // eslint-disable-next-line no-alert
                    alert('Deload weeks removed: start week adjusted to 18 (max for no-deload program).')
                    clampedStart = 18
                  }
                  onUpdate({ programWithDeloads: nextWithDeloads, programStartWeek: clampedStart })
                }}
              />
            </div>
            {!isEditing && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Start program at week</span>
                <Select
                  value={String(Math.min(Math.max(data.programStartWeek ?? 1, 1), totalWeeks))}
                  onValueChange={(val) => onUpdate({ programStartWeek: parseInt(val) })}
                >
                  <SelectTrigger aria-label="Program start week" className="w-40 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((wk) => (
                      <SelectItem key={wk} value={String(wk)}>
                        Week {wk} of {totalWeeks}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {/* Weekday consistency hint */}
          {data.programStartDate && data.trainingDays.length > 0 && (
            (() => {
              const start = new Date(`${data.programStartDate}T00:00:00`);
              const startWeekday = start.getDay();
              const firstTraining = [...data.trainingDays].sort((a,b)=>a-b)[0];
              const ok = startWeekday === firstTraining;
              const weekdayName = DAYS_OF_WEEK[startWeekday]?.name ?? '';
              const firstName = DAYS_OF_WEEK[firstTraining]?.name ?? '';
              return (
                <p className={`text-xs ${ok ? 'text-muted-foreground' : 'text-destructive'}`}>
                  {ok
                    ? `Start date falls on your first training day (${firstName}).`
                    : `Warning: start date is ${weekdayName}, which does not match your first training day (${firstName}).`}
                </p>
              );
            })()
          )}

          {/* Program preview */}
          {usesRtf && rtfPreview.length > 0 && (
            <div className="mt-2 border rounded-md bg-background overflow-hidden">
              <div className="px-2 py-1.5 text-xs font-medium bg-muted/60 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  Program Preview (first 6 weeks – {data.programStyle === 'HYPERTROPHY' ? 'Hypertrophy' : 'Standard'})
                  {rtfExercises.length > 1 && (
                    <UiSelect value={previewExerciseId} onValueChange={val => setPreviewExerciseId(val)}>
                      <UiSelectTrigger className="h-6 w-40 text-xs">
                        <UiSelectValue placeholder="Exercise" />
                      </UiSelectTrigger>
                      <UiSelectContent>
                        {rtfExercises.map(ex => (
                          <UiSelectItem key={ex.exerciseId} value={ex.exerciseId}>{ex.exerciseId}</UiSelectItem>
                        ))}
                      </UiSelectContent>
                    </UiSelect>
                  )}
                </span>
                <span className="text-muted-foreground flex items-center gap-2">
                  {data.programWithDeloads ? '21 weeks total' : '18 weeks total'}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-6 px-2 text-[11px]">View full program</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Full Program ({data.programStyle === 'HYPERTROPHY' ? 'Hypertrophy' : 'Standard'})</DialogTitle>
                      </DialogHeader>
                      <div className="max-h-[60vh] overflow-auto border rounded-md">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-background">
                            <tr className="border-b">
                              <th className="px-2 py-1 text-left">Week</th>
                              <th className="px-2 py-1 text-left">Goal</th>
                              <th className="px-2 py-1 text-left">Top Set Load</th>
                              <th className="px-2 py-1 text-left">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fullProgram.map(row => (
                              <tr key={row.week} className="border-b last:border-b-0">
                                <td className="px-2 py-1">{row.week}</td>
                                <td className="px-2 py-1 whitespace-nowrap max-w-[180px] truncate" title={row.goal}>{row.goal}</td>
                                <td className="px-2 py-1">{row.weight}kg</td>
                                <td className="px-2 py-1 whitespace-nowrap max-w-[220px] truncate" title={row.action}>{row.action}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {tmTrend && tmTrend.adjustments.length > 0 && (
                        <div className="mt-3 text-xs space-y-1">
                          <p className="font-medium">TM Adjustments</p>
                          <ul className="list-disc ml-4 space-y-0.5">
                            {tmTrend.adjustments.map(a => (
                              <li key={a.week}>W{a.week}: {a.previousTm.toFixed(1)} → {a.newTm.toFixed(1)}kg ({a.percentChange >=0 ? '+' : ''}{a.percentChange.toFixed(1)}%)</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left border-b">
                    <th className="px-2 py-1 font-medium">Week</th>
                    <th className="px-2 py-1 font-medium">Goal</th>
                    <th className="px-2 py-1 font-medium">Top Set Load</th>
                  </tr>
                </thead>
                <tbody>
                  {rtfPreview.map(row => (
                    <tr key={row.week} className="border-b last:border-b-0">
                      <td className="px-2 py-1">{row.week}</td>
                      <td className="px-2 py-1 whitespace-nowrap max-w-[140px] truncate" title={row.goal}>{row.goal}</td>
                      <td className="px-2 py-1">{row.weight}kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
