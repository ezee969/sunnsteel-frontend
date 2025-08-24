'use client';

import WorkoutFilters from './components/WorkoutFilters';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { WorkoutFilter } from './types';
import WorkoutsList from './components/WorkoutsList';
// import ActiveWorkout from './components/ActiveWorkout';
import Link from 'next/link';
import { useRoutines } from '@/lib/api/hooks/useRoutines';

export default function RoutinesPage() {
  const [activeFilter, setActiveFilter] = useState<WorkoutFilter>('all');

  const listFilters = useMemo(() => {
    if (activeFilter === 'favorites') return { isFavorite: true } as const;
    if (activeFilter === 'completed') return { isCompleted: true } as const;
    // 'all' and 'recent' currently map to no backend filters
    return {} as const;
  }, [activeFilter]);

  const { data: routines, isLoading, error } = useRoutines(listFilters);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Routines
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Plan, track, and manage your workout routines.
            </p>
          </div>
          <Button asChild className="hidden h-10 gap-2 sm:flex">
            <Link href="/routines/new">
              <Plus className="h-4 w-4" />
              <span>Create Routine</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Mobile Create Button - Sticky at bottom on mobile */}
      <div className="sticky bottom-4 z-10 sm:hidden">
        <Button asChild className="w-full shadow-lg" size="lg">
          <Link href="/routines/new" className="flex items-center justify-center gap-2">
            <Plus className="h-5 w-5" />
            <span>Create Routine</span>
          </Link>
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col gap-4">
        <WorkoutFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
        <WorkoutsList
          routines={routines}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}
