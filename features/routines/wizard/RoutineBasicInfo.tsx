'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { RoutineWizardData } from './types';
import { ProgramScheduleSelector } from './components/ProgramScheduleSelector';
import { ProgramStartDatePicker } from './components/ProgramStartDatePicker';
import { useRoutineMetadataForm } from './hooks/useRoutineMetadataForm';
import { useProgramSchedule } from './hooks/useProgramSchedule';

interface RoutineBasicInfoProps {
  data: RoutineWizardData;
  onUpdate: (updates: Partial<RoutineWizardData>) => void;
}

export function RoutineBasicInfo({ data, onUpdate }: RoutineBasicInfoProps) {
  const { name, description, handleNameChange, handleDescriptionChange } =
    useRoutineMetadataForm({ data, onUpdate });

  const {
    selectedDate,
    isCalendarOpen,
    setCalendarOpen,
    handleModeChange,
    handleDateSelect,
    handleDateInputChange,
  } = useProgramSchedule({ data, onUpdate });

  const scheduleMode = (data.programScheduleMode ?? 'NONE') as NonNullable<
    RoutineWizardData['programScheduleMode']
  >;

  const usesRtf = data.days?.some((d) =>
    d.exercises?.some(
      (ex) =>
        ex.progressionScheme === 'PROGRAMMED_RTF' ||
        ex.progressionScheme === 'PROGRAMMED_RTF_HYPERTROPHY',
    ),
  )

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
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="routine-description">Description (Optional)</Label>
          <Textarea
            id="routine-description"
            placeholder="Describe your routine, goals, or any notes..."
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            rows={4}
          />
        </div>

        {/* Program Schedule */}
        <div className="space-y-4">
          <ProgramScheduleSelector value={scheduleMode} onChange={handleModeChange} />

          <ProgramStartDatePicker
            mode={scheduleMode}
            selectedDate={selectedDate}
            isOpen={isCalendarOpen}
            onOpenChange={setCalendarOpen}
            onSelectDate={handleDateSelect}
            onInputChange={handleDateInputChange}
          />

          {scheduleMode === 'TIMEFRAME' && (
            <div className="space-y-2">
              <Label htmlFor="program-timezone">Timezone</Label>
              <div className="flex items-center gap-2 w-full sm:w-96">
                <Input
                  id="program-timezone"
                  placeholder="e.g., America/New_York"
                  value={data.programTimezone ?? ''}
                  onChange={(e) => onUpdate({ programTimezone: e.target.value })}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="whitespace-nowrap"
                  onClick={() =>
                    onUpdate({
                      programTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    })
                  }
                >
                  Use system
                </Button>
              </div>
            </div>
          )}

          {scheduleMode === 'TIMEFRAME' && usesRtf && (
            <div className="text-xs text-muted-foreground space-y-1">
              {!data.programStartDate && (
                <p className="text-destructive">Program start date is required for RtF schedules.</p>
              )}
              {!data.programTimezone && (
                <p className="text-destructive">Timezone is required for RtF schedules.</p>
              )}
              {data.programTimezone && (
                <p>Timezone: {data.programTimezone}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
