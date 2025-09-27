'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TooltipProvider } from '@/components/ui/tooltip';
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
        </div>
      </div>
    </TooltipProvider>
  );
}
