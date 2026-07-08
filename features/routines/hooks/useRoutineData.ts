'use client';

import { useMemo } from 'react';
import { isProgramEnded } from '@/lib/utils/date';
import type { Routine } from '@/lib/api/types/routine.type';

/**
 * Custom hook for processing routine data and computing derived values
 *
 * Handles:
 * - Program status calculations
 * - Days per week computation
 * - Program end date validation
 * - Memoized calculations for performance
 */
export const useRoutineData = (routine: Routine | undefined) => {
  // Compute program status
  const programEnded = useMemo(() => {
    return routine?.programEndDate ? isProgramEnded(routine.programEndDate) : false;
  }, [routine?.programEndDate]);

  // Compute days per week
  const daysPerWeek = useMemo(() => {
    if (!routine?.days) return 0;
    return routine.days.length;
  }, [routine?.days]);

  // Check if routine has program configuration
  const hasProgram = useMemo(() => {
    return Boolean(routine?.programEndDate);
  }, [routine?.programEndDate]);

  return {
    programEnded,
    daysPerWeek,
    hasProgram,
  };
};
