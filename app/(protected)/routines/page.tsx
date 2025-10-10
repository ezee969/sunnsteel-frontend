'use client';

import WorkoutFilters from './components/WorkoutFilters';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { WorkoutFilter } from './types';
import WorkoutsList from './components/WorkoutsList';
import Link from 'next/link';
import { useRoutines } from '@/lib/api/hooks/useRoutines';
import { useRouter } from 'next/navigation';
import HeroSection from '@/components/layout/HeroSection';

export default function RoutinesPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<WorkoutFilter>('all');

  const listFilters = useMemo(() => {
    if (activeFilter === 'favorites') return { isFavorite: true } as const;
    if (activeFilter === 'completed') return { isCompleted: true } as const;
    // 'all' and 'recent' currently map to no backend filters
    return {} as const;
  }, [activeFilter]);

  const { data: routines, isLoading, error } = useRoutines(listFilters);
  useEffect(() => {
    router.prefetch('/routines/new');
  }, [router]);

  return (
    <div className="h-full min-h-0 flex flex-col gap-4 sm:gap-6">
      {/* Classical Hero */}
      <HeroSection
        imageSrc="/backgrounds/vertical-hero-greek-columns.webp"
        title={<>Routines</>}
        subtitle={<>Plan, track, and refine your training.</>}
     />
        {/* Header Section */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div />
          <Button asChild className="hidden h-10 gap-2 sm:flex">
            <Link href="/routines/new" prefetch>
              <Plus className="h-4 w-4" />
              <span>Create Routine</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <WorkoutFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
        <WorkoutsList routines={routines} isLoading={isLoading} error={error} />
      </div>
    </div>
  );
}
