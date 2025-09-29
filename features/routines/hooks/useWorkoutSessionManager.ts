'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStartSession } from '@/lib/api/hooks/useWorkoutSession';
import { getTodayDow, validateRoutineDayDate } from '@/lib/utils/date';
import type { Routine } from '@/lib/api/types/routine.type';

/**
 * Custom hook for managing workout session start logic and dialog states
 * 
 * Handles:
 * - Session start validation and conflicts
 * - Date validation and confirmation dialogs
 * - Loading states and error handling
 * - Navigation after successful session start
 */
export const useWorkoutSessionManager = (routineId: string, routine: Routine | undefined) => {
  const router = useRouter();
  const { mutateAsync: startSession, isPending: isStarting } = useStartSession();
  
  // Dialog states
  const [activeConflictOpen, setActiveConflictOpen] = useState(false);
  const [dateValidationOpen, setDateValidationOpen] = useState(false);
  const [dateConfirmOpen, setDateConfirmOpen] = useState(false);
  
  // Session management states
  const [startActingDayId, setStartActingDayId] = useState<string | null>(null);
  const [pendingDayId, setPendingDayId] = useState<string | null>(null);
  
  const todayDow = getTodayDow();

  /**
   * Proceeds with starting a workout session after all validations pass
   */
  const proceedStart = async (routineDayId?: string) => {
    if (!routineId || !routineDayId) return;
    
    try {
      setStartActingDayId(routineDayId);
      const session = await startSession({ routineId, routineDayId });
      if (session?.id) {
        router.push(`/workouts/sessions/${session.id}`);
      }
    } catch (e) {
      console.error('Failed to start session', e);
    } finally {
      setStartActingDayId(null);
    }
  };

  /**
   * Main handler for starting a workout session with validation checks
   */
  const handleStart = (routineDayId?: string, activeSession?: any) => {
    if (!routineId || !routineDayId || !routine?.days) return;

    // 1) Active session conflict: only allow resuming
    if (activeSession?.id && activeSession.routineDayId !== routineDayId) {
      setActiveConflictOpen(true);
      return;
    }

    // 2) Date validation: check if workout can be started today
    const day = routine.days.find((d) => d.id === routineDayId);
    if (day) {
      const validation = validateRoutineDayDate(day);
      if (!validation.isValid) {
        setPendingDayId(routineDayId);
        setDateValidationOpen(true);
        return;
      }
    }

    // 3) Date mismatch confirmation (for valid days that don't match today)
    if (day && day.dayOfWeek !== todayDow) {
      setPendingDayId(routineDayId);
      setDateConfirmOpen(true);
      return;
    }

    // 4) Start immediately
    void proceedStart(routineDayId);
  };

  /**
   * Handles confirmation from date mismatch dialog
   */
  const handleDateConfirm = () => {
    const toStart = pendingDayId;
    setDateConfirmOpen(false);
    setPendingDayId(null);
    void proceedStart(toStart ?? undefined);
  };

  /**
   * Closes all dialogs and resets pending state
   */
  const closeAllDialogs = () => {
    setActiveConflictOpen(false);
    setDateValidationOpen(false);
    setDateConfirmOpen(false);
    setPendingDayId(null);
  };

  return {
    // States
    isStarting,
    startActingDayId,
    pendingDayId,
    todayDow,
    
    // Dialog states
    activeConflictOpen,
    dateValidationOpen,
    dateConfirmOpen,
    
    // Handlers
    handleStart,
    proceedStart,
    handleDateConfirm,
    closeAllDialogs,
    
    // Dialog setters
    setActiveConflictOpen,
    setDateValidationOpen,
    setDateConfirmOpen,
  };
};