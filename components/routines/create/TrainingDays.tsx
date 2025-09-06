'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useSidebar } from '@/hooks/use-sidebar';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { RoutineWizardData } from './types';

interface TrainingDaysProps {
  data: RoutineWizardData;
  onUpdate: (updates: Partial<RoutineWizardData>) => void;
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

export function TrainingDays({ data, onUpdate }: TrainingDaysProps) {
  const { isMobile } = useSidebar();
  const [hasInteracted, setHasInteracted] = useState(data.trainingDays.length > 0);
  const usesRtf = data.days.some((d) =>
    d.exercises.some(
      (ex) =>
        ex.progressionScheme === 'PROGRAMMED_RTF' ||
        ex.progressionScheme === 'PROGRAMMED_RTF_HYPERTROPHY'
    )
  );

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

      {/* RtF Program Settings (shown only if any exercise uses RtF) */}
      {usesRtf && (
        <div className="bg-muted/30 p-3 md:p-4 rounded-lg space-y-3">
          <h4 className="font-medium text-sm md:text-base">RtF Program Settings</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Include deload weeks</span>
              <Checkbox
                aria-label="Include deload weeks"
                checked={!!data.programWithDeloads}
                onCheckedChange={(checked) =>
                  onUpdate({ programWithDeloads: Boolean(checked) })
                }
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Program start date</span>
              <Input
                aria-label="Program start date"
                type="date"
                value={data.programStartDate ?? ''}
                onChange={(e) => onUpdate({ programStartDate: e.target.value })}
                className="w-40 h-8 text-sm text-center"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Timezone (IANA)</span>
              <Input
                aria-label="Program timezone"
                placeholder="e.g. America/New_York"
                value={data.programTimezone ?? ''}
                onChange={(e) => onUpdate({ programTimezone: e.target.value })}
                className="w-56 h-8 text-sm text-center"
              />
            </div>
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
        </div>
      )}
    </div>
  );
}
