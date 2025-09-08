'use client';

import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RoutineWizardData } from './types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RoutineBasicInfoProps {
  data: RoutineWizardData;
  onUpdate: (updates: Partial<RoutineWizardData>) => void;
}

export function RoutineBasicInfo({ data, onUpdate }: RoutineBasicInfoProps) {
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
      <div className="space-y-2">
        <Label>Program Schedule</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <p className="text-xs text-muted-foreground">
              Choose &quot;Timeframe&quot; for programs that have a calendar start/end. Otherwise choose &quot;None&quot; for open-ended routines.
            </p>
          </div>

          {data.programScheduleMode === 'TIMEFRAME' && (
            <div className="space-y-1">
              <Label htmlFor="program-start-date">Program start date</Label>
              <Input
                id="program-start-date"
                aria-label="Program start date"
                type="date"
                value={data.programStartDate ?? ''}
                onChange={(e) => onUpdate({ programStartDate: e.target.value })}
                className="w-full sm:w-60 h-9"
              />
              <p className="text-xs text-muted-foreground">
                Timezone is detected automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
