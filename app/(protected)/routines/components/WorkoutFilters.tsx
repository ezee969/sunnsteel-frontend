'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Clock, Heart, ListChecks, LayoutGrid } from 'lucide-react';
import { ClassicalIcon, ClassicalIconName } from '@/components/icons/ClassicalIcon';
import type { WorkoutFilter } from '../types';

interface WorkoutFiltersProps {
  activeFilter: WorkoutFilter;
  onFilterChange: (filter: WorkoutFilter) => void;
}

type FilterItem = {
  id: WorkoutFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  classicalName?: ClassicalIconName;
  disabled: boolean;
};

const filters: readonly FilterItem[] = [
  { id: 'all', label: 'All Workout Routines', icon: LayoutGrid, classicalName: 'pillar-icon', disabled: false },
  { id: 'recent', label: 'Recent', icon: Clock, classicalName: 'hourglass', disabled: true },
  { id: 'favorites', label: 'Favorites', icon: Heart, disabled: false },
  { id: 'completed', label: 'Completed', icon: ListChecks, disabled: false },
] as const;

export default function WorkoutFilters({
  activeFilter,
  onFilterChange,
}: WorkoutFiltersProps) {
  return (
    <div className="relative w-full">
      <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
        {filters.map((filter) => (
          <Button
            key={filter.id}
            variant={activeFilter === filter.id ? 'default' : 'outline'}
            className={cn(
              'flex-shrink-0 gap-2',
              'h-9 px-3 text-sm sm:h-10 sm:px-4 sm:text-base',
              activeFilter === filter.id && 'bg-primary text-primary-foreground'
            )}
            onClick={() => onFilterChange(filter.id as WorkoutFilter)}
            disabled={filter.disabled}
          >
            {filter.classicalName ? (
              <ClassicalIcon name={filter.classicalName} className="h-4 w-4 flex-shrink-0" aria-hidden />
            ) : (
              <filter.icon className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="truncate">{filter.label}</span>
          </Button>
        ))}
      </div>
      {/* Gradient fade effect for mobile */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent sm:hidden" />
    </div>
  );
}
