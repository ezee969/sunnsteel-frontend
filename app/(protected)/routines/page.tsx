'use client';

import WorkoutFilters from './components/WorkoutFilters';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { WorkoutFilter } from './types';
import WorkoutsList from './components/WorkoutsList';
import ActiveWorkout from './components/ActiveWorkout';

export default function RoutinesPage() {
  const [activeFilter, setActiveFilter] = useState<WorkoutFilter>('all');

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Routines
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Plan, track, and manage your workout routines.
            </p>
          </div>
          <Button className="hidden sm:flex gap-2">
            <Plus className="h-4 w-4" />
            New Workout
          </Button>
        </div>
      </div>

      {/* Mobile Create Button */}
      <Button className="sm:hidden flex gap-2 mb-2">
        <Plus className="h-4 w-4" />
        New Workout
      </Button>

      <div className="grid gap-4 lg:grid-cols-[1fr,300px]">
        <div className="flex flex-col gap-4">
          <WorkoutFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
          <WorkoutsList filter={activeFilter} />
        </div>
        <ActiveWorkout className="hidden lg:block" />
      </div>
    </div>
  );
}
