'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Clock, Heart, ListChecks, LayoutGrid } from 'lucide-react';
import type { WorkoutFilter } from '../types';

interface WorkoutFiltersProps {
  activeFilter: WorkoutFilter;
  onFilterChange: (filter: WorkoutFilter) => void;
}

const filters = [
  { id: 'all', label: 'All Workout Routines', icon: LayoutGrid },
  { id: 'recent', label: 'Recent', icon: Clock },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'completed', label: 'Completed', icon: ListChecks },
] as const;

export default function WorkoutFilters({
  activeFilter,
  onFilterChange,
}: WorkoutFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.id ? 'default' : 'outline'}
          className={cn(
            'flex gap-2 whitespace-nowrap',
            activeFilter === filter.id && 'bg-primary text-primary-foreground'
          )}
          onClick={() => onFilterChange(filter.id as WorkoutFilter)}
        >
          <filter.icon className="h-4 w-4" />
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
