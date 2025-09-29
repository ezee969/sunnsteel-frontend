'use client';

import { Badge } from '@/components/ui/badge';

interface ExerciseCardProps {
  exercise: {
    id: string;
    exercise?: {
      name: string;
    };
    progressionScheme?: string;
    sets?: Array<{
      id?: string;
      reps: number;
      weightKg: number;
      rpe?: number;
    }>;
  };
}

/**
 * Card component for displaying exercise details within routine days
 * 
 * Features:
 * - Exercise name and progression scheme display
 * - Set details with reps, weight, and RPE
 * - Numbered set indicators
 */
export const ExerciseCard = ({ exercise }: ExerciseCardProps) => {
  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">{exercise.exercise?.name || 'Unknown Exercise'}</h4>
        {exercise.progressionScheme && (
          <Badge variant="outline" className="text-xs">
            {exercise.progressionScheme.replace('_', ' ')}
          </Badge>
        )}
      </div>
      
      {exercise.sets && exercise.sets.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Sets:</p>
          {exercise.sets.map((set, index) => (
            <div key={set.id || index} className="text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                {index + 1}
              </span>
              <span>
                {set.reps} reps @ {set.weightKg}kg
                {set.rpe && ` (RPE ${set.rpe})`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};