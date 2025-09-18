'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RoutineWizardData } from './types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';
import { InfoTooltip } from '@/components/InfoTooltip';

interface RoutineBasicInfoProps {
  data: RoutineWizardData;
  onUpdate: (updates: Partial<RoutineWizardData>) => void;
}

export function RoutineBasicInfo({ data, onUpdate }: RoutineBasicInfoProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Parse date string as local date to avoid timezone issues
  const selectedDate = data.programStartDate
    ? (() => {
        const [year, month, day] = data.programStartDate.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month is 0-indexed
        console.log('🔍 [DEBUG] selectedDate parsing:', {
          originalString: data.programStartDate,
          parsedDate: date,
          displayDate: date.toLocaleDateString(),
          isoString: date.toISOString(),
        });
        return date;
      })()
    : undefined;

  // Auto-detect timezone when using Timeframe schedule and missing timezone
  useEffect(() => {
    if (data.programScheduleMode !== 'TIMEFRAME') return;
    const tz = (data.programTimezone ?? '').trim();
    if (tz.length > 0) return;
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (browserTz) {
      onUpdate({ programTimezone: browserTz });
    }
  }, [data.programScheduleMode, data.programTimezone, onUpdate]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="routine-name">
            Routine Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="routine-name"
            placeholder="e.g., Push Pull Legs, Upper Lower, Full Body..."
            value={data.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="routine-description">Description (Optional)</Label>
          <Textarea
            id="routine-description"
            placeholder="Describe your routine, goals, or any notes..."
            value={data.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            rows={4}
          />
        </div>

        {/* Program Schedule */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Label>Program Schedule</Label>
            <InfoTooltip
              content="Choose 'Timeframe' for programs that have a calendar start/end. Otherwise choose 'None' for open-ended routines."
              side="right"
            />
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <Select
                value={data.programScheduleMode ?? 'NONE'}
                onValueChange={(val) => {
                  const mode = val as 'TIMEFRAME' | 'NONE';
                  const next: Partial<RoutineWizardData> = {
                    programScheduleMode: mode,
                  };
                  // If switching to NONE, clear programStartDate to avoid stale gating
                  if (mode === 'NONE') {
                    next.programStartDate = undefined;
                  }
                  onUpdate(next);
                }}
              >
                <SelectTrigger
                  aria-label="Program schedule"
                  className="w-full sm:w-72"
                >
                  <SelectValue placeholder="Choose schedule" />
                </SelectTrigger>
                <SelectContent className="max-w-[calc(100vw-2rem)]">
                  <SelectItem value="NONE">None (indefinite)</SelectItem>
                  <SelectItem value="TIMEFRAME">Timeframe (date-driven)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {data.programScheduleMode === 'TIMEFRAME' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="program-start-date">Program start date</Label>
                  <InfoTooltip
                    content="Select when your program begins. The timezone will be automatically detected based on your current location."
                    side="right"
                  />
                </div>
                {/* Visually hidden, accessible input for tests and a11y */}
                <Input
                  id="program-start-date"
                  type="date"
                  value={data.programStartDate ?? ''}
                  onChange={(e) =>
                    onUpdate({ programStartDate: e.target.value || undefined })
                  }
                  className="sr-only"
                />
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full sm:w-72 justify-start text-left font-normal',
                        !selectedDate && 'text-muted-foreground'
                      )}
                      aria-labelledby="program-start-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, 'dd/MM/yyyy')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          // Format date as local date string to avoid timezone issues
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0'); // month is 0-indexed
                          const day = String(date.getDate()).padStart(2, '0');
                          const formattedDate = `${year}-${month}-${day}`;

                          onUpdate({ programStartDate: formattedDate });
                        } else {
                          console.log('🔍 [DEBUG] Clearing date selection');
                          onUpdate({ programStartDate: undefined });
                        }
                        setCalendarOpen(false);
                      }}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
