'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface RoutineData {
  name: string;
  description?: string;
  trainingDays: number[];
  days: Array<{
    dayOfWeek: number;
    exercises: Array<{
      exerciseId: string;
      sets: Array<{
        setNumber: number;
        reps: number;
        weight?: number;
      }>;
      restSeconds: number;
    }>;
  }>;
}

interface RoutineBasicInfoProps {
  data: RoutineData;
  onUpdate: (updates: Partial<RoutineData>) => void;
}

export function RoutineBasicInfo({ data, onUpdate }: RoutineBasicInfoProps) {
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
    </div>
  );
}
