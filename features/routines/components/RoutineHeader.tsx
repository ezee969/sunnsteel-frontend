'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Heart, Check } from 'lucide-react';
import { ProgramStatusBadge } from './ProgramStatusBadge';
import ProgramStyleBadge from './ProgramStyleBadge';
import type { Routine } from '@/lib/api/types/routine.type';

interface RoutineHeaderProps {
  routine: Routine;
  daysPerWeek: number;
  hasProgram: boolean;
  programStyleText: string | null;
  onBack: () => void;
  onEdit: () => void;
  onToggleFavorite: () => void;
  onToggleCompleted: () => void;
  isToggling: boolean;
}

/**
 * Header component for routine detail page
 * 
 * Features:
 * - Back navigation and edit buttons
 * - Routine title and description
 * - Status badges (program, style, days per week)
 * - Favorite and completion toggle buttons
 */
export const RoutineHeader = ({
  routine,
  daysPerWeek,
  hasProgram,
  programStyleText,
  onBack,
  onEdit,
  onToggleFavorite,
  onToggleCompleted,
  isToggling,
}: RoutineHeaderProps) => {
  return (
    <div className="space-y-6">
      {/* Navigation and Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Routines
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFavorite}
            disabled={isToggling}
          >
            <Heart 
              className={`h-4 w-4 mr-2 ${routine.isFavorite ? 'fill-current text-red-500' : ''}`} 
            />
            {routine.isFavorite ? 'Unfavorite' : 'Favorite'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleCompleted}
            disabled={isToggling}
          >
            <Check 
              className={`h-4 w-4 mr-2 ${routine.isCompleted ? 'fill-current text-green-500' : ''}`} 
            />
            {routine.isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
          </Button>
          
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Title and Description */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{routine.name}</h1>
        {routine.description && (
          <p className="text-muted-foreground">{routine.description}</p>
        )}
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        {hasProgram && routine.programEndDate && (
          <ProgramStatusBadge routine={routine} />
        )}
        
        <Badge variant="secondary">
          {daysPerWeek} {daysPerWeek === 1 ? 'day' : 'days'} per week
        </Badge>
        
        {programStyleText && (
          <ProgramStyleBadge style={routine.programStyle!} />
        )}
      </div>
    </div>
  );
};