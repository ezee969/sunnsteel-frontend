'use client';

import { useMemo } from 'react';
import type { Routine } from '@/lib/api/types/routine.type';

/**
 * Custom hook for processing routine data and computing derived values
 *
 * Handles:
 * - Days per week computation
 * - Memoized calculations for performance
 */
export const useRoutineData = (routine: Routine | undefined) => {
  // Compute days per week
  const daysPerWeek = useMemo(() => {
    if (!routine?.days) return 0;
    return routine.days.length;
  }, [routine?.days]);

  return {
    daysPerWeek,
  };
};
